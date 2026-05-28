<?php
// api/hapus_pesanan.php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access. Silakan login terlebih dahulu.']);
    exit;
}

require_once 'db.php';

$input = file_get_contents("php://input");
$data = json_decode($input, true);

$id = isset($data['id']) ? (int)$data['id'] : 0;

if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'ID pesanan tidak valid']);
    exit;
}

// 1. Dapatkan dan hapus semua berkas file desain terkait
$filesResult = mysqli_query($conn, "SELECT path_file FROM files WHERE pesanan_id = $id");
if ($filesResult) {
    while ($row = mysqli_fetch_assoc($filesResult)) {
        $filePath = '../' . $row['path_file']; // stored as "uploads/filename", go up to root
        if (file_exists($filePath) && is_file($filePath)) {
            unlink($filePath);
        }
    }
}

// 2. Dapatkan dan hapus berkas bukti_bayar terkait jika ada
$pesananResult = mysqli_query($conn, "SELECT bukti_bayar FROM pesanan WHERE id = $id");
if ($pesananResult && mysqli_num_rows($pesananResult) > 0) {
    $row = mysqli_fetch_assoc($pesananResult);
    if (!empty($row['bukti_bayar'])) {
        $buktiPath = '../uploads/' . $row['bukti_bayar']; // stored as file name, e.g. "qris_proof.png"
        if (file_exists($buktiPath) && is_file($buktiPath)) {
            unlink($buktiPath);
        }
    }
}

// 3. Hapus data pesanan dari database (cascade delete akan menghapus baris di tabel `files`)
$deleteQuery = "DELETE FROM pesanan WHERE id = $id";

if (mysqli_query($conn, $deleteQuery)) {
    echo json_encode(['success' => true, 'message' => 'Pesanan berhasil dihapus']);
} else {
    echo json_encode(['success' => false, 'message' => 'Gagal menghapus database: ' . mysqli_error($conn)]);
}
?>
