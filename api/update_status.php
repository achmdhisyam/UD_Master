<?php
header('Content-Type: application/json');

require_once 'db.php';

$input = file_get_contents("php://input");
$data = json_decode($input, true);

$id = isset($data['id']) ? (int)$data['id'] : 0;
$status = isset($data['status']) ? mysqli_real_escape_string($conn, $data['status']) : '';

if ($id <= 0 || empty($status)) {
    echo json_encode(['success' => false, 'message' => 'ID pesanan atau status tidak valid']);
    exit;
}

$allowed = ['menunggu', 'diproses', 'selesai'];
if (!in_array($status, $allowed)) {
    echo json_encode(['success' => false, 'message' => 'Status tidak didukung']);
    exit;
}

$query = "UPDATE pesanan SET status = '$status' WHERE id = $id";
if (mysqli_query($conn, $query)) {
    echo json_encode(['success' => true, 'message' => 'Status pesanan berhasil diperbarui']);
} else {
    echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
}
?>
