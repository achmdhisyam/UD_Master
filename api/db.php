<?php
// api/db.php

$host = 'localhost';
$user = 'root';
$pass = '';
$dbname = 'ud_master';

// 1. Hubungkan ke server MySQL
$conn = mysqli_connect($host, $user, $pass);
if (!$conn) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . mysqli_connect_error()]);
    exit;
}

// 2. Buat database jika belum ada
$dbQuery = "CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
if (!mysqli_query($conn, $dbQuery)) {
    echo json_encode(['success' => false, 'message' => 'Failed to create database: ' . mysqli_error($conn)]);
    exit;
}

// 3. Pilih database
if (!mysqli_select_db($conn, $dbname)) {
    echo json_encode(['success' => false, 'message' => 'Failed to select database: ' . mysqli_error($conn)]);
    exit;
}

// 4. Buat tabel admin_users jika belum ada
$tableAdminQuery = "
    CREATE TABLE IF NOT EXISTS admin_users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";
if (mysqli_query($conn, $tableAdminQuery)) {
    // Check if there is an admin, insert default admin if empty
    $checkAdmin = mysqli_query($conn, "SELECT id, password FROM admin_users LIMIT 1");
    if (mysqli_num_rows($checkAdmin) == 0) {
        $hash = password_hash('admin123', PASSWORD_BCRYPT);
        mysqli_query($conn, "INSERT INTO admin_users (username, password) VALUES ('admin', '$hash')");
    } else {
        // Upgrade existing plaintext password if any
        $adminRow = mysqli_fetch_assoc($checkAdmin);
        if (substr($adminRow['password'], 0, 3) !== '$2y' && substr($adminRow['password'], 0, 3) !== '$2a') {
            $newHash = password_hash($adminRow['password'], PASSWORD_BCRYPT);
            mysqli_query($conn, "UPDATE admin_users SET password = '$newHash' WHERE id = " . $adminRow['id']);
        }
    }
}

// 5. Buat tabel pesanan jika belum ada
$tablePesananQuery = "
    CREATE TABLE IF NOT EXISTS pesanan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        layanan VARCHAR(100) NOT NULL,
        warna VARCHAR(100) DEFAULT '',
        jumlah INT NOT NULL,
        kertas VARCHAR(100) DEFAULT '',
        ukuran VARCHAR(100) DEFAULT '',
        pengiriman VARCHAR(100) NOT NULL,
        alamat TEXT DEFAULT NULL,
        catatan TEXT DEFAULT NULL,
        wa VARCHAR(20) NOT NULL,
        bayar VARCHAR(50) NOT NULL,
        harga DECIMAL(12, 2) NOT NULL,
        bukti_bayar VARCHAR(255) DEFAULT NULL,
        status VARCHAR(20) DEFAULT 'menunggu',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";
if (!mysqli_query($conn, $tablePesananQuery)) {
    echo json_encode(['success' => false, 'message' => 'Failed to create pesanan table: ' . mysqli_error($conn)]);
    exit;
}

// Tambah kolom bukti_bayar jika belum ada
$checkCol = mysqli_query($conn, "SHOW COLUMNS FROM pesanan LIKE 'bukti_bayar'");
if (mysqli_num_rows($checkCol) == 0) {
    mysqli_query($conn, "ALTER TABLE pesanan ADD COLUMN bukti_bayar VARCHAR(255) DEFAULT NULL");
}

// 6. Buat tabel files jika belum ada
$tableFilesQuery = "
    CREATE TABLE IF NOT EXISTS files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pesanan_id INT NOT NULL,
        nama_file VARCHAR(255) NOT NULL,
        path_file VARCHAR(255) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (pesanan_id) REFERENCES pesanan(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";
if (!mysqli_query($conn, $tableFilesQuery)) {
    echo json_encode(['success' => false, 'message' => 'Failed to create files table: ' . mysqli_error($conn)]);
    exit;
}

// 7. Buat tabel login_attempts jika belum ada (Rate Limiting)
$tableAttemptsQuery = "
    CREATE TABLE IF NOT EXISTS login_attempts (
        ip_address VARCHAR(45) PRIMARY KEY,
        attempts INT DEFAULT 1,
        last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";
if (!mysqli_query($conn, $tableAttemptsQuery)) {
    echo json_encode(['success' => false, 'message' => 'Failed to create login_attempts table: ' . mysqli_error($conn)]);
    exit;
}
?>
