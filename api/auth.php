<?php
session_start();
header('Content-Type: application/json');

require_once 'db.php';

$input = json_decode(file_get_contents('php://input'), true);
$action = isset($_GET['action']) ? $_GET['action'] : (isset($input['action']) ? $input['action'] : '');

if ($action === 'login') {
    $user = isset($input['username']) ? $input['username'] : (isset($_POST['username']) ? $_POST['username'] : 'admin');
    $pass = isset($input['password']) ? $input['password'] : '';
    
    // 1. Ambil IP Address pengakses
    $ip = $_SERVER['REMOTE_ADDR'];
    
    // 2. Cek apakah IP ini terdaftar di login_attempts (Rate Limiting)
    $attemptStmt = mysqli_prepare($conn, "SELECT attempts, UNIX_TIMESTAMP(last_attempt) as last_time FROM login_attempts WHERE ip_address = ?");
    mysqli_stmt_bind_param($attemptStmt, "s", $ip);
    mysqli_stmt_execute($attemptStmt);
    $attemptResult = mysqli_stmt_get_result($attemptStmt);
    $attemptRow = mysqli_fetch_assoc($attemptResult);
    mysqli_stmt_close($attemptStmt);
    
    $attempts = $attemptRow ? (int)$attemptRow['attempts'] : 0;
    $lastTime = $attemptRow ? (int)$attemptRow['last_time'] : 0;
    $now = time();
    
    // 3. Tentukan waktu tunggu (cooldown) bertahap
    $cooldown = 0;
    if ($attempts >= 10) {
        $cooldown = 900; // 15 menit
    } elseif ($attempts >= 5) {
        $cooldown = 300; // 5 menit
    } elseif ($attempts >= 3) {
        $cooldown = 60; // 1 menit
    }
    
    // 4. Jika masih dalam masa tunggu, langsung tolak login
    if ($cooldown > 0 && ($now - $lastTime) < $cooldown) {
        $remaining = $cooldown - ($now - $lastTime);
        $remainingMin = ceil($remaining / 60);
        $msg = $remaining >= 60 
            ? "Terlalu banyak percobaan login. Silakan tunggu " . $remainingMin . " menit lagi."
            : "Terlalu banyak percobaan login. Silakan tunggu " . $remaining . " detik lagi.";
        
        echo json_encode(["success" => false, "message" => $msg, "cooldown" => $remaining]);
        exit;
    }
    
    // 5. Cek username di database (Prepared Statement)
    $stmt = mysqli_prepare($conn, "SELECT password FROM admin_users WHERE username = ?");
    mysqli_stmt_bind_param($stmt, "s", $user);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $admin = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);
    
    if ($admin && password_verify($pass, $admin['password'])) {
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_user'] = $user;
        
        // Hapus catatan percobaan gagal untuk IP ini jika berhasil login (reset)
        $resetStmt = mysqli_prepare($conn, "DELETE FROM login_attempts WHERE ip_address = ?");
        mysqli_stmt_bind_param($resetStmt, "s", $ip);
        mysqli_stmt_execute($resetStmt);
        mysqli_stmt_close($resetStmt);
        
        echo json_encode(["success" => true]);
    } else {
        // Login gagal, catat percobaan salah
        if ($attempts === 0) {
            $insertStmt = mysqli_prepare($conn, "INSERT INTO login_attempts (ip_address, attempts) VALUES (?, 1)");
            mysqli_stmt_bind_param($insertStmt, "s", $ip);
            mysqli_stmt_execute($insertStmt);
            mysqli_stmt_close($insertStmt);
        } else {
            // Naikkan jumlah attempts (dan update last_attempt otomatis)
            $updateStmt = mysqli_prepare($conn, "UPDATE login_attempts SET attempts = attempts + 1, last_attempt = CURRENT_TIMESTAMP WHERE ip_address = ?");
            mysqli_stmt_bind_param($updateStmt, "s", $ip);
            mysqli_stmt_execute($updateStmt);
            mysqli_stmt_close($updateStmt);
        }
        
        echo json_encode(["success" => false, "message" => "Username atau password salah."]);
    }
    exit;
}

if ($action === 'check_session') {
    if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
        echo json_encode(["success" => true, "username" => $_SESSION['admin_user'] ?? 'admin']);
    } else {
        echo json_encode(["success" => false, "message" => "Sesi kedaluwarsa. Silakan login kembali."]);
    }
    exit;
}

if ($action === 'logout') {
    $_SESSION = array();
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    echo json_encode(["success" => true, "message" => "Logout berhasil."]);
    exit;
}

if ($action === 'change_password') {
    if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Unauthorized access. Silakan login terlebih dahulu."]);
        exit;
    }

    $user = isset($input['username']) && !empty($input['username']) ? $input['username'] : ($_SESSION['admin_user'] ?? 'admin');
    $old = isset($input['old_password']) ? $input['old_password'] : '';
    $new = isset($input['new_password']) ? $input['new_password'] : '';
    
    $stmt = mysqli_prepare($conn, "SELECT password FROM admin_users WHERE username = ?");
    mysqli_stmt_bind_param($stmt, "s", $user);
    mysqli_stmt_execute($stmt);
    $result = mysqli_stmt_get_result($stmt);
    $admin = mysqli_fetch_assoc($result);
    mysqli_stmt_close($stmt);
    
    if (!$admin || !password_verify($old, $admin['password'])) {
        echo json_encode(["success" => false, "message" => "Password lama salah."]);
        exit;
    }
    
    if (empty($new)) {
        echo json_encode(["success" => false, "message" => "Password baru tidak boleh kosong."]);
        exit;
    }
    
    $newHash = password_hash($new, PASSWORD_BCRYPT);
    $updateStmt = mysqli_prepare($conn, "UPDATE admin_users SET password = ? WHERE username = ?");
    mysqli_stmt_bind_param($updateStmt, "ss", $newHash, $user);
    mysqli_stmt_execute($updateStmt);
    mysqli_stmt_close($updateStmt);
    
    echo json_encode(["success" => true, "message" => "Password berhasil diubah."]);
    exit;
}

echo json_encode(["success" => false, "message" => "Invalid action"]);
?>
