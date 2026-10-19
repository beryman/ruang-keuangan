# Manajemen Uangku Uangmu

## Deploy ke Vercel

1. Unggah folder `ruang-keuangan` ini ke repositori GitHub, atau pilih folder ini sebagai root project saat membuat project Vercel.
2. Framework preset: **Other**. Build command dan output directory dapat dikosongkan karena ini aplikasi statis.
3. Deploy. Buka URL HTTPS hasil deploy untuk mengaktifkan service worker dan pemasangan PWA.

## Pasang di perangkat

- **iPhone/iPad:** buka URL di Safari → Bagikan → Tambahkan ke Layar Utama.
- **Android:** buka URL di Chrome → menu ⋮ → Install app / Tambahkan ke layar utama.
- **Mac:** buka URL di Chrome atau Edge → ikon Install di bilah alamat. Di Safari macOS, gunakan Tambahkan ke Dock bila tersedia.

Aplikasi menyimpan perubahan lokal dan shell aplikasi tersedia offline setelah kunjungan pertama. Data lokal tiap browser/perangkat terpisah sampai Supabase dihubungkan. Scan Nota Gemini hanya dapat dipakai dari alamat HTTPS, dengan API key dan izin domain yang benar; membuka `index.html` langsung sebagai `file://` akan memblokir koneksi API.

## Supabase

Koneksi Supabase tersedia melalui menu Pengaturan setelah URL project dan public anon key milik Anda dimasukkan. Buat project dan tabel snapshot mengikuti langkah di bawah. Gunakan **Project URL** dan **anon/public key**; jangan pernah menaruh `service_role` key di aplikasi browser.


## Aktifkan database Supabase

1. Buat project di Supabase dan tunggu provisioning selesai.
2. Buka **SQL Editor → New query**, salin isi `supabase/schema.sql`, lalu pilih **Run**.
3. Pada Supabase **Authentication → URL Configuration**, tambahkan alamat Vercel sebagai Site URL dan Redirect URL.
4. Deploy ulang versi aplikasi yang memiliki `supabase-sync.js`.
5. Di aplikasi buka **Pengaturan → Database Supabase**. Isi Project URL dan anon/public key dari **Project Settings → API**. Tekan **Simpan konfigurasi**, lalu **Buat akun** atau **Login**.
6. Saat login pertama kali tanpa data cloud, data browser ini dikirim sebagai snapshot awal. Jika database sudah berisi data, pilih **Pulihkan dari Supabase** atau **Unggah perangkat ini** dengan hati-hati. Pulihkan mengganti data lokal perangkat; unggah mengganti snapshot cloud.
7. Setelah dua perangkat login ke akun yang sama, aktifkan **Sinkronkan otomatis**. Jika perangkat lain lebih dahulu mengubah cloud, aplikasi menahan unggahan otomatis agar snapshot yang lebih baru tidak tertimpa; pulihkan data cloud pada perangkat tersebut.

Email/password pengguna tidak disimpan oleh aplikasi. Token login dan anon key disimpan lokal pada browser. Tabel memakai RLS dengan `auth.uid() = user_id`, jadi akun hanya bisa mengakses snapshot miliknya.
