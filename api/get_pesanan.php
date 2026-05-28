<?php
header('Content-Type: application/json');

require_once 'db.php';

$query = "
    SELECT p.*, GROUP_CONCAT(f.path_file) as file_paths, GROUP_CONCAT(f.nama_file) as file_names
    FROM pesanan p
    LEFT JOIN files f ON p.id = f.pesanan_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
";
$result = mysqli_query($conn, $query);

$orders = [];
if ($result) {
    while ($row = mysqli_fetch_assoc($result)) {
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
        $orders[] = $row;
    }
    echo json_encode(['success' => true, 'data' => $orders]);
} else {
    echo json_encode(['success' => false, 'message' => mysqli_error($conn)]);
}
