// Vercel serverless proxy for Gemini. The API key is passed per request and never persisted here.
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
  const key = (process.env.GEMINI_API_KEY || apiKey || '').trim();
  if (!key) {
    return res.status(400).json({ error: 'API key belum tersedia. Isi di Pengaturan Gemini atau tambahkan GEMINI_API_KEY pada Environment Variables Vercel.' });
  }
  if (typeof model !== 'string' || !/^gemini-[a-zA-Z0-9._-]+$/.test(model)) {
    return res.status(400).json({ error: 'Nama model Gemini tidak valid.' });
  }
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 12000) {
    return res.status(400).json({ error: 'Prompt OCR tidak valid.' });
  }
  if (image && (typeof image.data !== 'string' || image.data.length > 4_000_000 || !/^image\/(jpeg|png|webp)$/.test(image.mimeType || ''))) {
    return res.status(413).json({ error: 'Foto harus berupa JPG, PNG, atau WebP dan tidak melebihi batas ukuran.' });
  }

  const parts = [{ text: prompt }];
  if (image) parts.push({ inline_data: { mime_type: image.mimeType, data: image.data } });
  const requestBody = {
    contents: [{ role: 'user', parts }],
    generationConfig: { maxOutputTokens: 4096 },
  };
  if (schema) {
    requestBody.generationConfig.responseFormat = {
      text: { mimeType: 'APPLICATION_JSON', schema },
    };
  }

  let upstream;
  try {
    upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(60000),
      },
    );
  } catch (error) {
    return res.status(502).json({ error: `Server Vercel gagal menghubungi Gemini: ${error.message || 'koneksi gagal'}` });
  }

  let result;
  try { result = await upstream.json(); }
  catch { return res.status(502).json({ error: 'Gemini mengembalikan respons yang tidak dapat dibaca.' }); }

  if (!upstream.ok) {
    const message = result?.error?.message || `Gemini API gagal (${upstream.status}).`;
    const status = [400, 401, 403, 404, 429].includes(upstream.status) ? upstream.status : 502;
    return res.status(status).json({ error: message, upstreamStatus: upstream.status });
  }
  return res.status(200).json(result);
};
