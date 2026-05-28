# UD_Master — Portal Pemesanan & Cetak Online

UD_Master adalah platform berbasis web modern yang dirancang untuk mempermudah pemesanan cetak/print (layanan **Offset**) dan potong kertas (layanan **Pound**). Sistem ini mencakup alur pemesanan bagi pelanggan, pembayaran dinamis berbasis QRIS, pelacakan pesanan secara real-time, serta Dashboard Admin premium untuk pengelolaan transaksi dan berkas desain.

---

## 🚀 Fitur Utama

### 👤 Portal Pelanggan (Client-Side)
- **Kalkulator Estimasi Harga Otomatis:** Perhitungan harga instan berdasarkan kuantitas lembar, jenis layanan (Offset/Pound), warna cetak, jenis kertas, dan ukuran kertas.
- **Sistem Unggah Berkas Desain:** Mendukung pengunggahan berkas desain (PDF, DOCX, XLSX, CSV, Gambar) dengan progress bar interaktif dan validasi keamanan tipe MIME.
- **Pembayaran QRIS Dinamis:** Generator otomatis nominal pembayaran sesuai harga total pesanan terintegrasi dengan generator QR Code di browser.
- **Pelacakan Status Pesanan (Real-Time Timeline):** Pelanggan dapat mengecek status pengerjaan pesanan secara transparan menggunakan nomor antrian.
- **Integrasi WhatsApp:** Link konfirmasi otomatis untuk langsung mengirim detail pesanan ke WhatsApp admin setelah pembayaran selesai.

### 🛡️ Dashboard Admin (Admin-Side)
- **Sistem Keamanan Login:** Proteksi sesi aman, hashing password menggunakan bcrypt, serta penanganan pembatasan login cooldown secara bertahap (rate-limiting).
- **Manajemen Daftar Pesanan:** Tabel interaktif pencarian pesanan, filter jenis layanan, ringkasan statistik omzet, serta pembaruan status pengerjaan (Menunggu ➔ Diproses ➔ Selesai).
- **Pratinjau Berkas Premium (Client-Side Render):** Dukungan baca dan tampilkan langsung (preview) berbagai berkas unggahan pelanggan tanpa perlu mengunduh:
  * **Gambar (PNG, JPG, WEBP)** ➔ Popup gambar menggunakan SweetAlert2.
  * **PDF** ➔ Embed berkas di dalam modal.
  * **Word (DOCX)** ➔ Render halaman langsung menggunakan library `docx-preview`.
  * **Excel (XLSX, CSV)** ➔ Render tabel lengkap dengan tombol navigasi perpindahan sheet (SheetJS).
- **Pengaturan Sistem Dinamis:**
  * Konfigurasi nomor WhatsApp admin target.
  * Unggah gambar QRIS statis toko yang secara otomatis didecode string QR-nya untuk keperluan nominal dinamis.
  * Fitur sembunyikan area dropzone unggahan secara dinamis ketika file QRIS aktif.
  * Ganti password admin secara aman.

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

1. **Clone atau Salin Proyek:**
   Tempatkan folder `UD_Master` di direktori root server Anda (misal `C:\laragon\www\UD_Master` jika memakai Laragon).

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

## 📱 Mengakses Proyek Lewat HP (Satu Jaringan Wi-Fi/LAN)

Agar website ini dapat diakses dan diuji langsung melalui perangkat HP menggunakan web server lokal komputer Anda:

1. **Cari IP Address Komputer:**
   Buka Command Prompt (CMD) di Windows, jalankan perintah `ipconfig`, lalu catat **IPv4 Address** aktif Anda (contoh: `192.168.1.15`).
   
2. **Buka di Browser HP:**
   Gunakan browser HP Anda untuk mengakses URL dengan alamat IP komputer:
   ```text
   http://192.168.1.15/UD_Master
   ```
   
3. **Konfigurasi Firewall (Jika Koneksi Timed Out):**
   Jika HP gagal memuat halaman, pastikan jenis jaringan Wi-Fi di Windows disetel ke **Private Network** atau izinkan port **Apache HTTP Server** (port 80/443) melewati Windows Defender Firewall.

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
