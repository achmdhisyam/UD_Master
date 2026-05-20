<?php
header('Content-Type: application/json');

$configFile = 'config.json';
$defaultConfig = [
    "wa_number" => "6281234567890",
    "qris_string" => "",
    "qris_image" => ""
];

if (!file_exists($configFile)) {
    file_put_contents($configFile, json_encode($defaultConfig));
}

$config = json_decode(file_get_contents($configFile), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Handle file upload
    if (isset($_FILES['qris_image']) && $_FILES['qris_image']['error'] === UPLOAD_ERR_OK) {
        $ext = pathinfo($_FILES['qris_image']['name'], PATHINFO_EXTENSION);
        $allowed = ['jpg', 'jpeg', 'png'];
        if (in_array(strtolower($ext), $allowed)) {
            $uploadDir = '../uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            $filename = 'qris_static.' . $ext;
            $targetPath = $uploadDir . $filename;
            if (move_uploaded_file($_FILES['qris_image']['tmp_name'], $targetPath)) {
                $config['qris_image'] = 'uploads/' . $filename;
            }
        }
    }

    // Handle other parameters from POST
    if (isset($_POST['wa_number'])) {
        $config['wa_number'] = preg_replace('/[^0-9]/', '', $_POST['wa_number']);
    }
    if (isset($_POST['qris_string'])) {
        $config['qris_string'] = trim($_POST['qris_string']);
    }

    // Fallback for json request body if content-type is json
    $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';
    if (stripos($contentType, 'application/json') !== false) {
        $input = json_decode(file_get_contents('php://input'), true);
        if (isset($input['wa_number'])) {
            $config['wa_number'] = preg_replace('/[^0-9]/', '', $input['wa_number']);
        }
        if (isset($input['qris_string'])) {
            $config['qris_string'] = trim($input['qris_string']);
        }
    }

    file_put_contents($configFile, json_encode($config));
    echo json_encode(["success" => true, "message" => "Pengaturan berhasil disimpan!", "data" => $config]);
    exit;
}

// GET method
$returnData = $config;
if (isset($returnData['admin_password'])) {
    unset($returnData['admin_password']);
}
echo json_encode(["success" => true, "data" => $returnData]);
?>
