// Memberi konfigurasi PUBLIK Supabase (URL + anon key) dari Environment Variables Vercel,
// supaya perangkat baru tidak perlu menempelkan URL & key secara manual.
// Anon key memang dirancang publik (dibatasi RLS). JANGAN pernah memasukkan service_role key.
module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const url = String(process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
  const key = String(process.env.SUPABASE_ANON_KEY || '').trim();
  if (!/^https:\/\/[\w.-]+$/.test(url) || !key) return res.status(200).json({ configured: false });
  return res.status(200).json({ configured: true, url, key });
};
