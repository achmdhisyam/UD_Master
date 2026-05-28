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
$nama = mysqli_real_escape_string($conn, $data['nama'] ?? '');
$layanan = mysqli_real_escape_string($conn, $data['layanan'] ?? '');
$warna = mysqli_real_escape_string($conn, isset($data['warna']) ? implode(",", $data['warna']) : '');
$jumlah = (int)($data['qty'] ?? 0);
$kertas = mysqli_real_escape_string($conn, $data['kertas'] ?? '');
$ukuran = mysqli_real_escape_string($conn, $data['ukuran'] ?? '');
$pengiriman = mysqli_real_escape_string($conn, $data['pengiriman'] ?? '');
$alamat = mysqli_real_escape_string($conn, $data['alamat'] ?? '');
$catatan = mysqli_real_escape_string($conn, $data['catatan'] ?? '');
$wa = mysqli_real_escape_string($conn, $data['wa'] ?? '');
$bayar = mysqli_real_escape_string($conn, $data['bayar'] ?? '');
$harga = (float)($data['harga'] ?? 0);
$status = 'menunggu';
$bukti_bayar = mysqli_real_escape_string($conn, $data['bukti_bayar'] ?? '');

$query = "INSERT INTO pesanan (nama, layanan, warna, jumlah, kertas, ukuran, pengiriman, alamat, catatan, wa, bayar, harga, bukti_bayar, status) 
          VALUES ('$nama', '$layanan', '$warna', '$jumlah', '$kertas', '$ukuran', '$pengiriman', '$alamat', '$catatan', '$wa', '$bayar', '$harga', '$bukti_bayar', '$status')";

if (mysqli_query($conn, $query)) {
    $id = mysqli_insert_id($conn);
    
    // Process files if any
    if (isset($data['serverFiles']) && is_array($data['serverFiles'])) {
        foreach ($data['serverFiles'] as $fileInfo) {
            $nama_file = mysqli_real_escape_string($conn, $fileInfo['saved_name']);
            $path = mysqli_real_escape_string($conn, "uploads/" . $fileInfo['saved_name']); // stored relative to root
            
            mysqli_query($conn, "INSERT INTO files (pesanan_id, nama_file, path_file) VALUES ('$id', '$nama_file', '$path')");
        }
    }
    
    echo json_encode(['success' => true, 'antrian' => $id]);
} else {
    echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
}
