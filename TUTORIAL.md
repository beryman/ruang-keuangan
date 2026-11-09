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

Untuk scan nota, buka menu **Scan Nota** (pribadi) atau tab Scan Nota di **Rosario**, lalu masukkan API key Gemini di Pengaturan Gemini. Foto dibaca otomatis setelah dipilih. Pilihan yang lebih aman: di Vercel **Project → Settings → Environment Variables**, tambahkan `GEMINI_API_KEY`, lalu redeploy. Jika API key diisi lewat aplikasi, batasi penggunaannya pada **Generative Language API**.

## D. Simpan dan backup data

Saat ini data tersimpan lokal di browser/perangkat. Artinya, data yang dibuat di iPhone belum otomatis muncul di Android atau Mac. Jangan hapus data situs/browser sebelum mengekspor atau mencadangkan data. Modul Kos memiliki menu **Backup & Restore** untuk backup JSON; transaksi utama dapat diekspor dari menu masing-masing.

Sinkronisasi lintas perangkat tersedia setelah menghubungkan project Supabase. Ikuti bagian E. Siapkan **Project URL** dan **anon/public key**; jangan masukkan `service_role` key di aplikasi browser.


## v38: Kos menyatu & tombol ＋

- **Tombol ＋ minggir saat menggulir ke bawah** dan muncul lagi saat menggulir ke atas, jadi tidak menutupi nominal. Pil status sinkron di pojok atas juga ikut minggir.
- **Kos di HP/iPad** memakai menu bergaya aplikasi utama: Dashboard, Tagihan, Pembayaran, Penyewa, dan **Lainnya** (berisi menu lain + pilihan kos bila punya lebih dari satu).
- **Tarik ke bawah di halaman Kos** untuk sinkron, sama seperti halaman lain.
- **Tombol ＋ di halaman Kos** menjalankan "+ Tambah" milik Kos sesuai menu yang sedang dibuka (mis. Kamar → tambah kamar). Tombol ini otomatis disembunyikan saat jendela Kos terbuka agar tidak menutupi tombol Simpan.
- Saat dibuka dari aplikasi utama, Kos tidak lagi menampilkan logo KOSMAN, label "Administrator", dan tombol Refresh/Sinkronkan ganda — sinkron diatur dari pil status di pojok atas.

## Kenyamanan v37

- **Nominal otomatis berformat** saat mengetik (1.250.000).
- **Tombol tanggal cepat** di form: Hari ini, Kemarin, 2 hari lalu.
- **Transaksi favorit:** centang "Simpan juga sebagai favorit" saat mencatat. Favorit muncul sebagai tombol ⭐ di bawah Catat Cepat; sekali ketuk langsung tercatat hari ini. Tekan **✎ Atur** untuk menghapus.
- **Hapus tanpa konfirmasi + Batalkan:** transaksi langsung terhapus, lalu muncul tombol **Batalkan** selama 6 detik.
- **Status sinkron** di pojok kanan atas: ✓ Tersimpan, ⟳ Sinkron…, ⚠ Offline / Belum sinkron. Ketuk untuk sinkron sekarang.
- **Angka di ikon aplikasi** = jumlah penyewa Kos yang perlu ditagih (Android, Mac, iPhone iOS 16.4+ yang dipasang di layar utama).
- **Tarik ke bawah** di HP untuk sinkron.
- **Ukuran teks** Normal/Besar di Pengaturan › Tema tampilan.
- **Layar pembuka** hijau saat dibuka dari ikon iPhone/iPad (pasang ulang ikon agar muncul).
- **Mode privasi:** tombol 👁 di pojok kanan atas menyamarkan semua nominal (Rp •••••). PDF dan teks yang disalin tetap berisi angka asli.

## Tampilan v36

- **HP:** menu bawah berisi Dashboard, Transaksi, Rosario, Kos, dan **Lainnya**. Lainnya membuka Manajemen Uangku, Tunai, Anggaran, Target, dan Pengaturan.
- **Tunai** menjadi satu menu dengan tab Dinar, Bagas, dan Bersama. Tab terakhir yang dibuka diingat.
- **Tombol ＋ bulat** di kanan bawah (HP dan tablet) untuk menambah transaksi. Di Rosario membuka form Kantorku, di Tunai akunnya langsung terisi.
- **Daftar transaksi di HP** berupa kartu yang dikelompokkan per hari ("Hari ini", "Kemarin"). Ketuk kartu untuk mengedit.
- **Catat Cepat di layar kecil:** tombol Simpan menjadi ikon ✓.
- **Tabel Kos di HP** tampil sebagai kartu, tidak perlu digeser ke samping.
- **iPad mendatar / layar lebar:** form transaksi muncul sebagai panel kanan, daftar transaksi tetap terlihat di kiri.

## Fitur v34

- **Peringatan anggaran saat mencatat:** setelah menyimpan pengeluaran (form, Catat Cepat, Scan Nota), muncul pesan bila kategori sudah 80% atau melewati anggaran bulan itu.
- **Ringkasan akhir bulan otomatis:** di awal bulan, Dashboard menampilkan kartu ringkasan bulan lalu (pemasukan, pengeluaran, disisihkan, kategori terbesar, anggaran terlampaui) dengan tombol unduh PDF. Tekan **Tutup** agar tidak muncul lagi.
- **Tanya data keuanganmu:** panel di Dashboard. Ketik pertanyaan (mis. "berapa makan bulan lalu?"); ringkasan data dikirim ke Gemini. Memakai API key yang sama dengan Scan Nota. Jawaban AI bisa keliru, cek angka penting.
- **Backup otomatis mingguan:** tiap 7 hari saat aplikasi dibuka. Bila sudah login, file disimpan di cloud (8 terakhir); bila tidak, file .json diunduh (iPhone hanya mengingatkan). Atur dan pulihkan di **Pengaturan → Backup**.
- **Reimburse:** centang **Talangan kantor** saat mencatat pengeluaran pribadi untuk kantor. Di **Rosario → Dashboard** ada daftar talangan; tandai yang sudah diganti, maka saldo pribadi bertambah dan Saldo Kantorku berkurang otomatis. Bisa dibatalkan.
- **Laporan per kamar (Kos):** menu Laporan → Laporan per Kamar: bulan terisi/kosong, pendapatan, perawatan, beban bersama, dan untung per kamar per tahun.
- **Akses bersama pasangan:** jalankan ulang `supabase/schema.sql`. Di **Pengaturan → Berbagi data**, undang email pasangan; pasangan login dengan akunnya sendiri lalu tekan **Cari undangan → Gabung**. Data di perangkat pasangan diganti data bersama (salinan lama dicadangkan). Transaksi menampilkan siapa yang mencatat bila ada dua pencatat.

## Fitur v33

- **Kos → akun keuangan:** saat *Catat Pembayaran* atau *Tambah Pengeluaran* di Kos, pilih akun (mis. BCA / Tunai Dinar). Transaksinya otomatis muncul di Manajemen Uangku (tanda 🏠 dari Kos) sebagai Transfer Masuk/Keluar, saldo akun langsung cocok. Ubah/hapus cukup dari Kos — transaksi keuangannya ikut. Akun terakhir yang dipilih diingat.
- **Scan bukti transfer:** Kos → Pembayaran → *📷 Scan bukti TF*. Gemini membaca nominal, tanggal, pengirim, dan nomor referensi, mencocokkan penyewa, lalu mengisi form. Ada peringatan bila nomor referensi sudah pernah dicatat, status gagal/pending, atau penyewa tidak pasti. Setelah disimpan, bukti terlampir dan invoice berstempel langsung terbuka. (Buka Kos dari menu Kos di aplikasi utama.)
- **Catat cepat:** kotak ⚡ di Dashboard, Manajemen Uangku, dan Transaksi. Contoh: `makan siang 25rb gopay`, `gaji 5jt bca`, `bensin 50 ribu tunai dinar kemarin`, `+200000 tunai bersama jual barang`. Tekan Enter; ada tombol *Batalkan*. Tanpa akun → memakai akun terakhir. 🎤 untuk mengucapkan (Chrome/Android).
- **Pintasan ikon:** tekan lama ikon aplikasi (Android/desktop Chrome) → Catat cepat, Tambah transaksi, Scan nota, Catat bayar kos. Pasang ulang aplikasi bila pintasan belum muncul. iPhone belum mendukung fitur ini.

## Fitur v32

- **WAJIB sekali:** buka Supabase → SQL Editor, jalankan ulang seluruh isi `supabase/schema.sql` (membuat bucket privat `receipts` untuk foto). Tanpa ini foto tetap aman di perangkat, hanya belum pindah ke cloud.
- **Foto di cloud:** foto nota & bukti transfer otomatis dipindah ke Supabase Storage saat online dan login. Data sinkron jadi kecil sehingga sinkron antarperangkat tetap cepat. Foto lama ikut dipindah otomatis.
- **Pengingat tagihan Kos:** Dashboard utama menampilkan penyewa yang terlambat atau jatuh tempo ≤ H-Reminder (Kos → Setting). Tekan *Aktifkan notifikasi* agar muncul notifikasi saat aplikasi dibuka. Di Kos → Dashboard, tombol **WA** membuka pesan tagihan yang sudah terisi dan menandai "diingatkan hari ini".
- **Transaksi berulang:** centang *Ulangi otomatis tiap bulan* saat menambah transaksi. Kelola/hentikan di Transaksi → 🔁 Transaksi berulang.
- **Kategori otomatis:** keterangan yang sama dengan transaksi sebelumnya langsung mengisi kategori & subkategori; impor CSV BCA juga memakai tebakan ini.

## Fitur v26

- **Tampilan mingguan + PDF**: di Transaksi, Rosario (Transaksi Kantorku), dan halaman Tunai ada tombol *Mingguan* (Senin–Minggu). Gunakan panah, kotak tanggal, atau *Minggu ini*, lalu tekan *PDF Mingguan*.
- **Foto nota**: foto yang diunggah di Scan Nota (atau lewat form transaksi) dikompres otomatis (target sekitar 70 KB) dan tersimpan bersama transaksi. Tombol *Nota* di kolom Aksi membuka foto dan tombol *Unduh foto*. Foto nota ikut masuk lampiran PDF mingguan.
- **Kos**: tampilan memakai tema hijau yang sama dengan aplikasi utama dan mengikuti tema Green Colorful atau Midnight Green.

## E. Hubungkan Supabase

1. Buat project Supabase gratis, lalu buka **SQL Editor**.
2. Buka file `supabase/schema.sql` dari paket aplikasi, salin seluruh SQL, dan jalankan di project Anda.
3. Dari Supabase **Project Settings → API**, salin Project URL dan anon/public key.
4. **Cara termudah (disarankan):** di Vercel **Project → Settings → Environment Variables**, tambahkan `SUPABASE_URL` (Project URL) dan `SUPABASE_ANON_KEY` (anon/public key), lalu redeploy. Setiap perangkat baru otomatis terhubung tanpa menempel URL dan key lagi. Pada Supabase **Authentication → URL Configuration**, isi *Site URL* dengan alamat Vercel Anda agar tautan reset password dan verifikasi email kembali ke aplikasi.
   Alternatif manual: buka **Pengaturan → Akun & Sinkronisasi → Koneksi database**, isi URL dan key, lalu **Simpan koneksi**.
5. Di **Pengaturan → Akun & Sinkronisasi**, isi email dan password lalu tekan **Masuk** (atau Enter). Belum punya akun? Pilih tab **Daftar**. Lupa password? Tekan **Lupa password?**, buka tautan di email, lalu atur password baru. Jika Supabase meminta verifikasi email, verifikasi dulu lalu masuk.
6. Pada perangkat pertama, bila belum ada data cloud, aplikasi mengunggah data lokal sebagai snapshot awal. Pada perangkat lain yang masih kosong, cukup masuk dengan akun yang sama: data cloud otomatis dipulihkan. Jika perangkat itu sudah berisi data yang berbeda, aplikasi meminta Anda memilih **Pakai data cloud** atau **Pakai data perangkat ini**.
7. Aktifkan **Sinkronkan otomatis**. Jika aplikasi memberi tahu bahwa cloud berubah dari perangkat lain, pulihkan cloud sebelum melanjutkan agar perubahan baru tidak tertimpa.

Data keuangan dan Kos berada pada snapshot privat per akun login. SQL menerapkan Row Level Security. Jangan pernah memakai atau membagikan `service_role` key; aplikasi hanya memerlukan anon/public key.
