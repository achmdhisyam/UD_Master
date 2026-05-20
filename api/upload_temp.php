<?php
header('Content-Type: application/json');

$folder = "../uploads/";
if (!is_dir($folder)) {
    mkdir($folder, 0777, true);
}

$uploaded_files = [];

if (isset($_FILES['file'])) {
    foreach ($_FILES['file']['name'] as $key => $nama_file) {
        $tmp = $_FILES['file']['tmp_name'][$key];
        
        // supaya nama file tidak sama
        $nama_baru = time() . "_" . preg_replace("/[^a-zA-Z0-9\._-]/", "_", $nama_file);
        $path = $folder . $nama_baru;
        
        if (move_uploaded_file($tmp, $path)) {
            $uploaded_files[] = [
                'original_name' => $nama_file,
                'saved_name' => $nama_baru,
                'path' => $path
            ];
        }
    }
    
    echo json_encode(['success' => true, 'files' => $uploaded_files]);
} else {
    echo json_encode(['success' => false, 'message' => 'No files uploaded']);
}
