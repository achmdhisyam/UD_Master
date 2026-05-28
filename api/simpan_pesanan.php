<?php
header('Content-Type: application/json');

require_once 'db.php';

$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON payload']);
    exit;
}

// Extract fields
$nama = $data['nama'] ?? '';
$layanan = $data['layanan'] ?? '';
$warna = isset($data['warna']) && is_array($data['warna']) ? implode(",", $data['warna']) : '';
$jumlah = (int)($data['qty'] ?? 0);
$kertas = $data['kertas'] ?? '';
$ukuran = $data['ukuran'] ?? '';
$pengiriman = $data['pengiriman'] ?? '';
$alamat = $data['alamat'] ?? '';
$catatan = $data['catatan'] ?? '';
$wa = $data['wa'] ?? '';
$bayar = $data['bayar'] ?? '';
$harga = (float)($data['harga'] ?? 0);
$status = 'menunggu';
$bukti_bayar = $data['bukti_bayar'] ?? '';

// Prepared Statement untuk pesanan
$stmt = mysqli_prepare($conn, "INSERT INTO pesanan (nama, layanan, warna, jumlah, kertas, ukuran, pengiriman, alamat, catatan, wa, bayar, harga, bukti_bayar, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
mysqli_stmt_bind_param($stmt, "sssisssssssdss", $nama, $layanan, $warna, $jumlah, $kertas, $ukuran, $pengiriman, $alamat, $catatan, $wa, $bayar, $harga, $bukti_bayar, $status);

if (mysqli_stmt_execute($stmt)) {
    $id = mysqli_insert_id($conn);
    mysqli_stmt_close($stmt);
    
    // Process files if any (Prepared Statement)
    if (isset($data['serverFiles']) && is_array($data['serverFiles'])) {
        $fileStmt = mysqli_prepare($conn, "INSERT INTO files (pesanan_id, nama_file, path_file) VALUES (?, ?, ?)");
        foreach ($data['serverFiles'] as $fileInfo) {
            $nama_file = $fileInfo['saved_name'];
            $path = "uploads/" . $fileInfo['saved_name']; // stored relative to root
            mysqli_stmt_bind_param($fileStmt, "iss", $id, $nama_file, $path);
            mysqli_stmt_execute($fileStmt);
        }
        mysqli_stmt_close($fileStmt);
    }
    
    echo json_encode(['success' => true, 'antrian' => $id]);
} else {
    echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
}
?>
