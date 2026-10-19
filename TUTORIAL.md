# Tutorial Manajemen Uangku Uangmu

## A. Download dan buka di Mac

1. Unduh `Manajemen-Uangku-Uangmu.zip` dari tautan yang dibagikan di chat.
2. Di Finder, buka folder **Downloads**, lalu klik dua kali file ZIP. macOS akan membuat folder `ruang-keuangan`.
3. Buka folder itu dan klik dua kali `index.html` untuk mencoba aplikasi.
4. Menu Kos berada di sidebar. Data transaksi pribadi, Rosario, dan Kos disimpan oleh browser pada perangkat yang digunakan.

Membuka file langsung cocok untuk mencoba fitur lokal. Scan Nota Gemini dan kamera perlu alamat HTTPS; dari `file://` browser memblokir koneksi ke API. Deploy dulu ke alamat HTTPS menggunakan langkah berikut.

## B. Deploy gratis ke Vercel

### Siapkan GitHub

1. Masuk atau daftar di GitHub, lalu buat repository baru, misalnya `manajemen-uangku`.
2. Buka repository tersebut dan pilih **Add file → Upload files**.
3. Dari folder hasil ekstrak, unggah seluruh isi folder `ruang-keuangan`, termasuk `index.html`, `manifest.webmanifest`, `app-icon.svg`, `sw.js`, `vercel.json`, serta folder `api`, `supabase`, dan `kos`.
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

Setelah instalasi, ikon aplikasi muncul di layar utama/Dock. Buka sekali saat online agar cangkang aplikasi tersimpan untuk pemakaian offline. Scan Nota dengan Gemini memerlukan internet dan API key aktif. Versi ini memakai endpoint serverless Vercel di folder `api/`, jadi domain harus menjalankan versi paket terbaru.

Untuk scan nota, masukkan API key Gemini di Pengaturan Scan Nota. Pilihan yang lebih aman: di Vercel **Project → Settings → Environment Variables**, tambahkan `GEMINI_API_KEY`, lalu redeploy. Jika API key diisi lewat aplikasi, batasi penggunaannya pada **Generative Language API**.

## D. Simpan dan backup data

Saat ini data tersimpan lokal di browser/perangkat. Artinya, data yang dibuat di iPhone belum otomatis muncul di Android atau Mac. Jangan hapus data situs/browser sebelum mengekspor atau mencadangkan data. Modul Kos memiliki menu **Backup & Restore** untuk backup JSON; transaksi utama dapat diekspor dari menu masing-masing.

Sinkronisasi lintas perangkat tersedia setelah menghubungkan project Supabase. Ikuti bagian E. Siapkan **Project URL** dan **anon/public key**; jangan masukkan `service_role` key di aplikasi browser.


## E. Hubungkan Supabase

1. Buat project Supabase gratis, lalu buka **SQL Editor**.
2. Buka file `supabase/schema.sql` dari paket aplikasi, salin seluruh SQL, dan jalankan di project Anda.
3. Dari Supabase **Project Settings → API**, salin Project URL dan anon/public key.
4. Setelah versi terbaru aplikasi dideploy ke Vercel, buka menu **Pengaturan → Database Supabase**. Masukkan URL dan key, lalu pilih **Simpan konfigurasi**.
5. Pilih **Buat akun** dengan email dan password yang akan dipakai di semua perangkat. Jika Supabase meminta verifikasi email, buka email tersebut; setelah terverifikasi, kembali ke aplikasi dan tekan **Login & cek database**.
6. Pada perangkat pertama, bila belum ada data cloud, aplikasi mengunggah data lokal sebagai snapshot awal. Pada perangkat lain, login dengan akun yang sama lalu pilih **Pulihkan dari Supabase** untuk menyalin data cloud ke perangkat itu.
7. Aktifkan **Sinkronkan otomatis**. Jika aplikasi memberi tahu bahwa cloud berubah dari perangkat lain, pulihkan cloud sebelum melanjutkan agar perubahan baru tidak tertimpa.

Data keuangan dan Kos berada pada snapshot privat per akun login. SQL menerapkan Row Level Security. Jangan pernah memakai atau membagikan `service_role` key; aplikasi hanya memerlukan anon/public key.
