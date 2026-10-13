<?php
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
 "status"=>"ok",
 "jeu"=>"Manga Top Trump",
 "regle"=>"Premier à 7 manches gagnées",
 "cartes_minimum"=>20
], JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
?>