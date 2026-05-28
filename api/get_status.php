<?php
header('Content-Type: application/json');

require_once 'db.php';

$id = isset($_GET['antrian']) ? (int)$_GET['antrian'] : 0;
$wa = isset($_GET['wa']) ? preg_replace('/[^0-9]/', '', $_GET['wa']) : '';

if ($id <= 0 || empty($wa)) {
    echo json_encode(['success' => false, 'message' => 'Nomor antrian atau nomor WhatsApp tidak valid']);
    exit;
}

// Prepared Statement untuk mencegah SQL Injection (A1)
$stmt = mysqli_prepare($conn, "
    SELECT p.*, GROUP_CONCAT(f.path_file) as file_paths, GROUP_CONCAT(f.nama_file) as file_names
    FROM pesanan p
    LEFT JOIN files f ON p.id = f.pesanan_id
    WHERE p.id = ?
    GROUP BY p.id
");
mysqli_stmt_bind_param($stmt, "i", $id);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);

if ($result && mysqli_num_rows($result) > 0) {
    $row = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);

    // Bersihkan karakter non-angka dari nomor WA untuk perbandingan yang adil
    $cleanDbWa = preg_replace('/[^0-9]/', '', $row['wa']);
    $cleanInputWa = preg_replace('/[^0-9]/', '', $wa);

    // Bandingkan 9 digit terakhir untuk menghindari kesalahan format (seperti 08... vs 628...)
    $suffixDb = substr($cleanDbWa, -9);
    $suffixInput = substr($cleanInputWa, -9);

    if ($suffixDb !== $suffixInput) {
        echo json_encode(['success' => false, 'message' => 'Nomor WhatsApp tidak cocok dengan nomor antrian Anda.']);
        exit;
    }

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
    echo json_encode(['success' => false, 'message' => 'Nomor antrian tidak ditemukan.']);
}
?>
