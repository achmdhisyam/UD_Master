<?php

$conn = mysqli_connect("localhost","root","","ud_master");

$nama = $_POST['nama'];
$layanan = $_POST['layanan'];
$jumlah = $_POST['jumlah'];
$catatan = $_POST['catatan'];

$warna = "";
if(isset($_POST['warna'])){
    $warna = implode(",", $_POST['warna']);
}

mysqli_query($conn,"
INSERT INTO pesanan(nama,layanan,warna,jumlah,catatan)
VALUES('$nama','$layanan','$warna','$jumlah','$catatan')
");

$id = mysqli_insert_id($conn); // id pesanan terakhir

$folder = "uploads/";

// proses upload file
if(isset($_FILES['file'])){
    foreach ($_FILES['file']['name'] as $key => $nama_file) {

        $tmp = $_FILES['file']['tmp_name'][$key];

        // supaya nama file tidak sama
        $nama_baru = time() . "_" . $nama_file;

        $path = $folder . $nama_baru;

        move_uploaded_file($tmp, $path);

        mysqli_query($conn,"INSERT INTO files (pesanan_id,nama_file,path_file)
        VALUES ('$id','$nama_baru','$path')");
    }
}

// redirect setelah semua selesai
header("Location: form2.html");
exit;

?>