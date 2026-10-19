# Manajemen Uangku Uangmu

## Deploy ke Vercel

1. Unggah folder `ruang-keuangan` ini ke repositori GitHub, atau pilih folder ini sebagai root project saat membuat project Vercel.
2. Framework preset: **Other**. Build command dan output directory dapat dikosongkan karena ini aplikasi statis.
3. Deploy. Buka URL HTTPS hasil deploy untuk mengaktifkan service worker dan pemasangan PWA.

## Pasang di perangkat

- **iPhone/iPad:** buka URL di Safari → Bagikan → Tambahkan ke Layar Utama.
- **Android:** buka URL di Chrome → menu ⋮ → Install app / Tambahkan ke layar utama.
- **Mac:** buka URL di Chrome atau Edge → ikon Install di bilah alamat. Di Safari macOS, gunakan Tambahkan ke Dock bila tersedia.

Aplikasi menyimpan perubahan lokal dan shell aplikasi tersedia offline setelah kunjungan pertama. Data lokal tiap browser/perangkat masih terpisah. Sinkronisasi lintas perangkat belum aktif.

## Supabase

Belum ada koneksi Supabase pada aplikasi karena URL project dan public anon key belum tersedia. Untuk sinkronisasi lintas perangkat, langkah berikutnya adalah membuat project Supabase, mengaktifkan login pengguna, membuat tabel snapshot dengan Row Level Security, lalu menambahkan koneksi aplikasi. Gunakan **Project URL** dan **anon/public key**; jangan pernah menaruh `service_role` key di aplikasi browser. Database belum menerima data apa pun.
