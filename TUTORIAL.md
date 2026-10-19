# Tutorial Manajemen Uangku Uangmu

## A. Download dan buka di Mac

1. Unduh `Manajemen-Uangku-Uangmu.zip` dari tautan yang dibagikan di chat.
2. Di Finder, buka folder **Downloads**, lalu klik dua kali file ZIP. macOS akan membuat folder `ruang-keuangan`.
3. Buka folder itu dan klik dua kali `index.html` untuk mencoba aplikasi.
4. Menu Kos berada di sidebar. Data transaksi pribadi, Rosario, dan Kos disimpan oleh browser pada perangkat yang digunakan.

Membuka file langsung cocok untuk mencoba aplikasi. Agar dapat dipasang sebagai aplikasi di iPhone, iPad, Android, atau Mac, deploy dulu ke alamat HTTPS menggunakan langkah berikut.

## B. Deploy gratis ke Vercel

### Siapkan GitHub

1. Masuk atau daftar di GitHub, lalu buat repository baru, misalnya `manajemen-uangku`.
2. Buka repository tersebut dan pilih **Add file → Upload files**.
3. Dari folder hasil ekstrak, unggah seluruh isi folder `ruang-keuangan`: `index.html`, `manifest.webmanifest`, `app-icon.svg`, `sw.js`, `vercel.json`, dan folder `kos`.
4. Tekan **Commit changes**.

### Terbitkan lewat Vercel

1. Masuk atau daftar di Vercel dengan akun GitHub.
2. Pilih **Add New → Project**, lalu **Import** repository `manajemen-uangku`.
3. Untuk Framework Preset, pilih **Other**. Biarkan Build Command kosong dan Output Directory kosong. Pastikan Root Directory adalah folder berisi `index.html` dan `vercel.json`.
4. Pilih **Deploy**. Setelah selesai, Vercel memberi alamat HTTPS seperti `nama-project.vercel.app`.
5. Buka alamat itu dan coba menu Dashboard, Manajemen Uangku, Rosario, dan Kos.

Perubahan yang diunggah ke repository dapat diterbitkan ulang oleh Vercel. Simpan salinan ZIP sebagai backup aplikasi.

## C. Pasang di perangkat

Gunakan alamat HTTPS Vercel yang sama:

- **iPhone:** buka alamat di Safari → tekan tombol Bagikan → **Add to Home Screen / Tambahkan ke Layar Utama** → Add.
- **iPad:** langkahnya sama seperti iPhone; gunakan Safari.
- **Android:** buka alamat di Chrome → tekan menu ⋮ → **Install app / Pasang aplikasi**. Jika pilihan itu belum muncul, pilih **Add to Home screen**.
- **Mac:** buka di Chrome atau Edge, lalu pilih ikon **Install** di bilah alamat atau menu browser. Safari macOS dapat memakai **Add to Dock** bila tersedia.

Setelah instalasi, ikon aplikasi muncul di layar utama/Dock. Buka sekali saat online agar cangkang aplikasi tersimpan untuk pemakaian offline. Fitur yang perlu internet, seperti Scan Nota dengan Gemini, tetap memerlukan koneksi.

## D. Simpan dan backup data

Saat ini data tersimpan lokal di browser/perangkat. Artinya, data yang dibuat di iPhone belum otomatis muncul di Android atau Mac. Jangan hapus data situs/browser sebelum mengekspor atau mencadangkan data. Modul Kos memiliki menu **Backup & Restore** untuk backup JSON; transaksi utama dapat diekspor dari menu masing-masing.

Sinkronisasi lintas perangkat memakai Supabase belum aktif. Perlu dibuat project Supabase, login pengguna, aturan keamanan Row Level Security, dan koneksi sinkronisasi aplikasi. Untuk melanjutkan bagian ini, siapkan **Project URL** dan **anon/public key** dari Supabase. Jangan membagikan atau memasukkan `service_role` key di aplikasi browser.
