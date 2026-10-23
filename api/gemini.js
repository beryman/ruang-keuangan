// Vercel serverless proxy untuk Gemini.
// API key dikirim per permintaan (atau dari env GEMINI_API_KEY) dan tidak pernah disimpan di sini.

const FALLBACK_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'];
const RETRYABLE = [429, 500, 502, 503, 504];
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Gemini REST menerima subset OpenAPI dengan nama tipe huruf besar (STRING, OBJECT, ...).
function toGeminiSchema(node) {
  if (Array.isArray(node)) return node.map(toGeminiSchema);
  if (!node || typeof node !== 'object') return node;
  const out = {};
  for (const [k, v] of Object.entries(node)) {
    if (k === 'type' && typeof v === 'string') out.type = v.toUpperCase();
    else if (k === 'additionalProperties' || k === '$schema') continue;
    else out[k] = toGeminiSchema(v);
  }
  return out;
}

async function callGemini(model, key, body, timeoutMs) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    },
  );
  let json = {};
  try { json = await res.json(); } catch { json = {}; }
  return { ok: res.ok, status: res.status, json };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Gunakan metode POST.' });
  }

  let input = req.body;
  if (typeof input === 'string') {
    try { input = JSON.parse(input); }
    catch { return res.status(400).json({ error: 'Isi permintaan OCR tidak valid.' }); }
  }
  const { apiKey, model, prompt, image, schema } = input || {};
  // Key yang diisi pengguna di aplikasi diprioritaskan; jika kosong baru pakai env Vercel.
  const key = String(apiKey || process.env.GEMINI_API_KEY || '').trim();
  if (!key) {
    return res.status(400).json({ error: 'API key belum tersedia. Isi di Pengaturan Gemini atau tambahkan GEMINI_API_KEY pada Environment Variables Vercel.' });
  }
  if (typeof model !== 'string' || !/^gemini-[a-zA-Z0-9._-]+$/.test(model)) {
    return res.status(400).json({ error: 'Nama model Gemini tidak valid.' });
  }
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 12000) {
    return res.status(400).json({ error: 'Prompt OCR tidak valid.' });
  }
  let imageData = '';
  if (image) {
    imageData = String(image.data || '').replace(/^data:[^,]+,/, '');
    if (!imageData || imageData.length > 4_000_000 || !/^image\/(jpeg|png|webp)$/.test(image.mimeType || '')) {
      return res.status(413).json({ error: 'Foto harus berupa JPG, PNG, atau WebP dan tidak melebihi batas ukuran.' });
    }
  }

  // Urutan instruksi: gambar dulu, teks sesudahnya (rekomendasi Google untuk OCR/visi).
  const parts = [];
  if (image) parts.push({ inline_data: { mime_type: image.mimeType, data: imageData } });
  parts.push({ text: prompt });

  const baseConfig = { maxOutputTokens: 8192, temperature: 0 };
  const jsonConfig = schema
    ? { responseMimeType: 'application/json', responseSchema: toGeminiSchema(schema) }
    : {};
  // Konfigurasi "penuh" (resolusi gambar tinggi) dan konfigurasi minimal sebagai cadangan.
  const fullConfig = { ...baseConfig, ...jsonConfig, ...(image ? { mediaResolution: 'MEDIA_RESOLUTION_HIGH' } : {}) };
  const minimalConfig = { ...baseConfig, ...jsonConfig };

  const models = [model, ...FALLBACK_MODELS.filter(m => m !== model)];
  let last = null;
  let useMinimal = false;
  const t0 = Date.now();
  const remaining = () => 54000 - (Date.now() - t0); // batas total < maxDuration 60 dtk

  for (let m = 0; m < models.length; m++) {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (remaining() < 5000) break;
      let out;
      try {
        out = await callGemini(models[m], key, {
          contents: [{ role: 'user', parts }],
          generationConfig: useMinimal ? minimalConfig : fullConfig,
        }, Math.min(45000, remaining()));
      } catch (error) {
        const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
        last = { status: timedOut ? 504 : 502, error: timedOut ? 'Gemini terlalu lama merespons. Coba lagi, atau potong foto hanya pada bagian nota.' : `Server Vercel gagal menghubungi Gemini: ${error.message || 'koneksi gagal'}` };
        if (!timedOut && attempt < 2) { await sleep(800 * (attempt + 1)); continue; }
        break;
      }

      if (out.ok) {
        out.json.modelUsed = models[m];
        return res.status(200).json(out.json);
      }

      const msg = out.json?.error?.message || `Gemini API gagal (${out.status}).`;
      last = { status: out.status, error: msg };

      // Parameter opsional (mis. mediaResolution) tidak dikenali model ini -> ulangi dengan konfigurasi minimal.
      if (out.status === 400 && !useMinimal && /mediaResolution|unknown name|invalid json payload|not supported/i.test(msg)) {
        useMinimal = true; attempt--; continue;
      }
      // Model tidak ada / tidak diizinkan -> coba model cadangan.
      if (out.status === 404) break;
      // Server Gemini sibuk / rate limit sementara -> tunggu sebentar lalu ulangi.
      if (RETRYABLE.includes(out.status) && attempt < 2) { await sleep(1000 * (attempt + 1)); continue; }
      break;
    }
    // 400/401/403 tidak membaik dengan model lain.
    if (last && [400, 401, 403, 504].includes(last.status)) break;
  }

  const status = [400, 401, 403, 404, 429].includes(last?.status) ? last.status : 502;
  return res.status(status).json({ error: last?.error || 'Gemini tidak merespons.', upstreamStatus: last?.status });
};
