<?php
$c = mysqli_connect('localhost', 'root', '', 'ud_master');
if (!$c) die('Connection failed');
$res = mysqli_query($c, 'DESCRIBE pesanan');
if ($res) {
    while ($row = mysqli_fetch_assoc($res)) {
        echo $row['Field'] . ' - ' . $row['Type'] . "\n";
    }
} else {
    echo 'Table pesanan not found';
}
