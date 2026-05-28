<?php
header('Content-Type: application/json');

require_once 'db.php';

$input = json_decode(file_get_contents('php://input'), true);
$action = isset($_GET['action']) ? $_GET['action'] : (isset($input['action']) ? $input['action'] : '');

if ($action === 'login') {
    $user = isset($input['username']) ? $input['username'] : (isset($_POST['username']) ? $_POST['username'] : 'admin');
    $pass = isset($input['password']) ? $input['password'] : '';
    
    $stmt = mysqli_prepare($conn, "SELECT password FROM admin_users WHERE username = ?");
    mysqli_stmt_bind_param($stmt, "s", $user);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $admin = mysqli_fetch_assoc($result);
    
    if ($admin && $pass === $admin['password']) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "message" => "Username atau password salah."]);
    }
    exit;
}

if ($action === 'change_password') {
    $user = isset($input['username']) && !empty($input['username']) ? $input['username'] : 'admin';
    $old = isset($input['old_password']) ? $input['old_password'] : '';
    $new = isset($input['new_password']) ? $input['new_password'] : '';
    
    $stmt = mysqli_prepare($conn, "SELECT password FROM admin_users WHERE username = ?");
    mysqli_stmt_bind_param($stmt, "s", $user);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $admin = mysqli_fetch_assoc($result);
    
    if (!$admin || $old !== $admin['password']) {
        echo json_encode(["success" => false, "message" => "Password lama salah."]);
        exit;
    }
    
    if (empty($new)) {
        echo json_encode(["success" => false, "message" => "Password baru tidak boleh kosong."]);
        exit;
    }
    
    $updateStmt = mysqli_prepare($conn, "UPDATE admin_users SET password = ? WHERE username = ?");
    mysqli_stmt_bind_param($updateStmt, "ss", $new, $user);
    mysqli_stmt_execute($updateStmt);
    
    echo json_encode(["success" => true, "message" => "Password berhasil diubah."]);
    exit;
}

echo json_encode(["success" => false, "message" => "Invalid action"]);
