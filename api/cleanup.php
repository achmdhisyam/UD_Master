<?php
// api/cleanup.php

// Pastikan koneksi DB tersedia
require_once __DIR__ . '/db.php';

$folder = __DIR__ . '/../uploads/';
if (!is_dir($folder)) {
    return;
}

// 1. Ambil nama file QRIS agar tidak terhapus
$qrisFile = '';
$configFile = __DIR__ . '/config.json';
if (file_exists($configFile)) {
    $config = json_decode(file_get_contents($configFile), true);
    if (isset($config['qris_image']) && !empty($config['qris_image'])) {
        $qrisFile = basename($config['qris_image']);
    }
}

// 2. Ambil semua file yang terdaftar di database (desain & bukti_bayar)
$usedFiles = [];

// Dari tabel files (berkas desain)
$resFiles = mysqli_query($conn, "SELECT nama_file FROM files");
if ($resFiles) {
    while ($row = mysqli_fetch_assoc($resFiles)) {
        $usedFiles[basename($row['nama_file'])] = true;
    }
}

// Dari tabel pesanan (bukti_bayar)
$resBukti = mysqli_query($conn, "SELECT bukti_bayar FROM pesanan WHERE bukti_bayar IS NOT NULL AND bukti_bayar != ''");
if ($resBukti) {
    while ($row = mysqli_fetch_assoc($resBukti)) {
        $usedFiles[basename($row['bukti_bayar'])] = true;
    }
}

// 2.b. Hapus otomatis file desain dari pesanan selesai berusia > 30 hari (B2)
$thirtyDaysAgo = date('Y-m-d H:i:s', time() - 30 * 24 * 3600);
$queryOldFiles = "
    SELECT f.id, f.nama_file, f.path_file 
    FROM files f 
    JOIN pesanan p ON f.pesanan_id = p.id 
    WHERE p.status = 'selesai' AND p.created_at < '$thirtyDaysAgo'
";
$resOldFiles = mysqli_query($conn, $queryOldFiles);
if ($resOldFiles) {
    while ($row = mysqli_fetch_assoc($resOldFiles)) {
        $oldPath = __DIR__ . '/../' . $row['path_file'];
        if (file_exists($oldPath) && is_file($oldPath)) {
            unlink($oldPath);
        }
        // Hapus record file dari database agar tidak membingungkan sistem pembersih
        mysqli_query($conn, "DELETE FROM files WHERE id = " . $row['id']);
        // Hapus juga dari map usedFiles
        unset($usedFiles[basename($row['nama_file'])]);
    }
}

// 3. Scan folder uploads
$filesInDir = scandir($folder);
$now = time();
$twoHours = 2 * 3600; // 2 jam dalam detik

foreach ($filesInDir as $file) {
    if ($file === '.' || $file === '..') {
        continue;
    }

    $filePath = $folder . $file;

    if (is_file($filePath)) {
        // Jangan hapus berkas QRIS toko
        if (!empty($qrisFile) && $file === $qrisFile) {
            continue;
        }

        // Cek umur file
        $fileAge = $now - filemtime($filePath);
        if ($fileAge > $twoHours) {
            // Jika file tidak terdaftar di database, hapus
            if (!isset($usedFiles[$file])) {
                unlink($filePath);
            }
        }
    }
}
?>
