# UD_Master — Portal Pemesanan & Cetak Online

UD_Master adalah platform berbasis web modern yang dirancang untuk mempermudah pemesanan cetak/print (layanan **Offset**) dan potong kertas (layanan **Pound**). Sistem ini mencakup alur pemesanan bagi pelanggan, pembayaran dinamis berbasis QRIS, pelacakan pesanan secara real-time, serta Dashboard Admin premium untuk pengelolaan transaksi dan berkas desain.

---

## 🚀 Fitur Utama

### 👤 Portal Pelanggan (Client-Side)
- **Kalkulator Estimasi Harga Otomatis:** Perhitungan harga instan berdasarkan kuantitas lembar, jenis layanan (Offset/Pound), warna cetak, jenis kertas, dan ukuran kertas.
- **Sistem Unggah Berkas Desain:** Mendukung pengunggahan berkas desain (PDF, DOCX, XLSX, CSV, Gambar) dengan progress bar interaktif, drag-and-drop zone, pratinjau berkas secara instan, dan validasi keamanan tipe MIME.
- **Pembayaran QRIS Dinamis & Manual:** Menampilkan QRIS dinamis (dengan nominal otomatis dari string QRIS yang ter-decode) serta QRIS statis (input nominal manual) jika string QRIS gagal ter-decode.
- **Unduh Resi Digital (Receipt Downloader):** Pelanggan dapat mengunduh bukti pesanan (resi) berupa gambar PNG langsung setelah checkout sukses untuk disimpan di perangkat lokal.
- **Pelacakan Status Pesanan dengan Validasi WhatsApp (Secure Order Tracking):** Pelanggan dapat mengecek status pengerjaan pesanan secara transparan (Menunggu, Diproses, Selesai) menggunakan nomor antrian. Proses pengecekan dilengkapi validasi nomor WhatsApp yang terdaftar untuk melindungi keamanan data pesanan dan mencegah akses berkas ilegal oleh pihak lain.
- **Floating WhatsApp Chat:** Tombol melayang WhatsApp di halaman depan (`index.html`) untuk memudahkan komunikasi langsung pelanggan ke admin.
- **Integrasi Kirim Pesan WhatsApp:** Menghasilkan link WhatsApp otomatis berisi template detail lengkap rincian pemesanan untuk konfirmasi manual cepat ke admin.
- **Indikator Langkah Formulir (Form Step Indicator):** Penanda visual alur pengerjaan formulir yang memandu pengguna melalui langkah-langkah input data hingga pembayaran.
- **Kartu Ringkasan Pemesanan Dinamis (Live Summary Card):** Panel samping interaktif yang merangkum semua opsi pesanan dan rincian harga secara real-time.
- **Pemberitahuan Interaktif SweetAlert2:** Notifikasi popup bergaya modern untuk alur konfirmasi pengiriman, kesalahan validasi form, dan proses pemuatan data.
- **Salin Klik Cepat (Copy-to-Clipboard Utility):** Kemudahan menyalin nomor rekening, nominal pembayaran, atau nomor antrian dalam satu klik pada halaman pembayaran.
- **Desain UI/UX Responsive & Fluid:** Antarmuka yang teroptimasi secara visual untuk kenyamanan akses pada perangkat Mobile, Tablet, dan Desktop.


### 🛡️ Dashboard Admin (Admin-Side)
- **Sistem Keamanan Login:** Proteksi sesi aman PHP Session, hashing password menggunakan bcrypt, serta penanganan pembatasan login cooldown secara bertahap (rate-limiting) untuk mencegah serangan brute-force.
- **Order Polling & Notifikasi Suara (Chime Notification):** Polling berkala setiap 30 detik untuk mendeteksi pesanan baru yang masuk, memicu suara notifikasi (chime), dan menampilkan notifikasi toast dinamis.
- **Manajemen Daftar Pesanan:** Tabel interaktif pencarian pesanan, pagination data, filter jenis layanan (Offset/Pound), ringkasan statistik omzet total, jumlah transaksi hari ini, serta pembaruan status pengerjaan.
- **Pratinjau Berkas Premium (Client-Side Render):** Dukungan baca dan tampilkan langsung (preview) berbagai berkas unggahan pelanggan tanpa perlu mengunduh:
  * **Gambar (PNG, JPG, WEBP)** ➔ Popup gambar menggunakan SweetAlert2.
  * **PDF** ➔ Embed berkas di dalam modal.
  * **Word (DOCX)** ➔ Render halaman langsung menggunakan library `docx-preview`.
  * **Excel (XLSX, CSV)** ➔ Render tabel lengkap dengan tombol navigasi perpindahan sheet (SheetJS).
- **Aksi Cepat Admin:** Tombol pintasan untuk mengirim notifikasi WhatsApp status pengerjaan ke pelanggan dengan template teks dinamis, serta tombol hapus transaksi permanen beserta berkas terkait.
- **Pengaturan Sistem Dinamis:**
  * Konfigurasi nomor WhatsApp admin target.
  * Unggah gambar QRIS statis toko yang secara otomatis didecode string QR-nya untuk keperluan nominal dinamis.
  * Ganti password admin secara aman.

  - **Sistem Tema Gelap/Terang Global:** Konsistensi transisi tema (Light & Night) yang mengikuti preferensi pengguna di seluruh halaman pelanggan.

### ⚙️ Sistem Backend & Pemeliharaan (Cron-like Cleanup)
- **Auto-Cleanup Script:** Pembersih otomatis berkas sampah di folder `uploads/` yang tidak terdaftar di database (> 2 jam) dan pembersih database pesanan yang sudah selesai (> 30 hari) secara berkala demi menghemat penyimpanan server.

---

## 🛠️ Persyaratan Sistem

Untuk menjalankan platform ini secara lokal atau di server, pastikan lingkungan Anda memenuhi spesifikasi berikut:
- **Web Server:** Apache / Nginx (sangat disarankan menggunakan **Laragon** atau XAMPP).
- **PHP:** Versi 8.0 ke atas.
- **Database:** MySQL / MariaDB.
- **Library Client-Side (di-load via CDN):**
  * SweetAlert2 (untuk notifikasi premium)
  * jsQR (untuk pembaca QR Code QRIS)
  * SheetJS (xlsx.full.min.js) & docx-preview (untuk render berkas)
  * FontAwesome 6 (untuk icon grafis)

---

## 💾 Langkah Instalasi (Local Development)

1. **Clone Proyek:**
   Buka terminal di direktori root server web Anda (misal `C:\laragon\www\` untuk pengguna Laragon) lalu jalankan perintah:
   ```bash
   git clone https://github.com/achmdhisyam/UD_Master.git
   ```

2. **Setup Database:**
   - Aktifkan MySQL di Laragon/XAMPP.
   - Buat database baru bernama `ud_master`.
   - Jalankan script [api/db.php](file:///c:/laragon/www/UD_Master/api/db.php) sekali untuk membuat struktur tabel secara otomatis. Caranya cukup buka browser dan akses:
     ```text
     http://localhost/UD_Master/api/db.php
     ```

3. **Login Admin Bawaan:**
   - Akses halaman admin di: `http://localhost/UD_Master/admin.html`
   - **Username:** `admin`
   - **Password:** `master`
   *Segera ganti password Anda di menu Pengaturan setelah masuk pertama kali.*

---

## 📁 Struktur Direktori

```text
UD_Master/
├── api/                       # API Backend (PHP)
│   ├── auth.php               # Login, logout, ganti password admin
│   ├── cleanup.php            # Auto-cleanup database & file yatim
│   ├── db.php                 # Koneksi & auto-setup tabel database
│   ├── get_pesanan.php        # API pemanggilan data pesanan (Admin)
│   ├── get_status.php         # API pemanggilan status pesanan (Pelanggan)
│   ├── hapus_pesanan.php      # API hapus transaksi & berkas terkait
│   ├── settings.php           # API manipulasi setelan WA & QRIS
│   ├── simpan_pesanan.php     # API checkout simpan transaksi baru
│   ├── update_status.php      # API ubah status pesanan
│   └── upload_temp.php        # API unggah berkas desain & bukti bayar
├── assets/                    # Aset Pendukung
│   ├── logo.png               # Logo UD_Master
│   └── shared.css             # Tema styling sentral (Light/Dark)
├── uploads/                   # Folder penyimpanan berkas terunggah
├── index.html                 # Halaman Beranda / Landing Page
├── form1.html                 # Formulir Unggah Berkas & Estimasi Layanan
├── form2.html                 # Formulir Pemilihan Jenis Kertas & Ukuran
├── form_pengiriman.html       # Formulir Info Penerima & Pengiriman
├── payment.html               # Halaman Pembayaran (QRIS / Cash)
├── cek_status.html            # Portal Pelacakan Pesanan Pelanggan
├── admin.html                 # Dashboard Admin & Pengaturan Sistem
└── README.md                  # Dokumentasi Proyek
```

---

## 📝 Catatan Pemeliharaan Keamanan
- Halaman admin dilengkapi penanganan **Progressive Rate Limiting** untuk mencegah serangan brute-force.
- Seluruh input SQL di backend diolah menggunakan **Prepared Statements (mysqli_prepare)** untuk menjamin sistem aman dari ancaman celah keamanan **SQL Injection (SQLi)**.
