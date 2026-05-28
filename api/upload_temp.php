<?php
header('Content-Type: application/json');

$allowed_exts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];

$folder = "../uploads/";
if (!is_dir($folder)) {
    mkdir($folder, 0777, true);
}

$uploaded_files = [];
$rejected = [];

if (isset($_FILES['file'])) {
    foreach ($_FILES['file']['name'] as $key => $nama_file) {
        $tmp = $_FILES['file']['tmp_name'][$key];
        $ext = strtolower(pathinfo($nama_file, PATHINFO_EXTENSION));

        if (!in_array($ext, $allowed_exts)) {
            $rejected[] = $nama_file;
            continue;
        }

        // Cek MIME Type asli berkas untuk keamanan (A2)
        $mime = mime_content_type($tmp);
        $allowed_mimes = [
            'pdf' => ['application/pdf'],
            'doc' => ['application/msword'],
            'docx' => ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            'xls' => ['application/vnd.ms-excel'],
            'xlsx' => ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
            'csv' => ['text/csv', 'text/plain', 'application/csv', 'text/comma-separated-values'],
            'jpg' => ['image/jpeg', 'image/pjpeg'],
            'jpeg' => ['image/jpeg', 'image/pjpeg'],
            'png' => ['image/png', 'image/x-png'],
            'gif' => ['image/gif'],
            'bmp' => ['image/bmp', 'image/x-ms-bmp'],
            'webp' => ['image/webp']
        ];

        $isValidMime = false;
        if (isset($allowed_mimes[$ext])) {
            if (in_array($mime, $allowed_mimes[$ext])) {
                $isValidMime = true;
            }
        }

        if (!$isValidMime) {
            $rejected[] = $nama_file;
            continue;
        }

        // Pastikan nama file aman
        $nama_baru = time() . "_" . preg_replace("/[^a-zA-Z0-9\._-]/", "_", $nama_file);
        $path = $folder . $nama_baru;

        if (move_uploaded_file($tmp, $path)) {
            $uploaded_files[] = [
                'original_name' => $nama_file,
                'saved_name'    => $nama_baru,
                'path'          => $path
            ];
        }
    }

    echo json_encode([
        'success'  => true,
        'files'    => $uploaded_files,
        'rejected' => $rejected
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'No files uploaded']);
}
