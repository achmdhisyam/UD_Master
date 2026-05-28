<?php
header('Content-Type: application/json');

require_once 'db.php';

$id = isset($_GET['antrian']) ? (int)$_GET['antrian'] : 0;
if ($id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Nomor antrian tidak valid']);
    exit;
}

$query = "
    SELECT p.*, GROUP_CONCAT(f.path_file) as file_paths, GROUP_CONCAT(f.nama_file) as file_names
    FROM pesanan p
    LEFT JOIN files f ON p.id = f.pesanan_id
    WHERE p.id = $id
    GROUP BY p.id
";
$result = mysqli_query($conn, $query);

if ($result && mysqli_num_rows($result) > 0) {
    $row = mysqli_fetch_assoc($result);
    $row['files'] = [];
    if (!empty($row['file_paths']) && !empty($row['file_names'])) {
        $paths = explode(',', $row['file_paths']);
        $names = explode(',', $row['file_names']);
        for ($i = 0; $i < count($paths); $i++) {
            $row['files'][] = [
                'path' => $paths[$i],
                'name' => $names[$i]
            ];
        }
    }
    unset($row['file_paths']);
    unset($row['file_names']);
    echo json_encode(['success' => true, 'data' => $row]);
} else {
    echo json_encode(['success' => false, 'message' => 'Pesanan tidak ditemukan']);
}
?>
