<?php
require_once 'db.php';
$c = $conn;
$res = mysqli_query($c, 'DESCRIBE pesanan');
if ($res) {
    while ($row = mysqli_fetch_assoc($res)) {
        echo $row['Field'] . ' - ' . $row['Type'] . "\n";
    }
} else {
    echo 'Table pesanan not found';
}
