<?php

require_once('../conf.php');

$httpStatusCodes = [
  200 => 'OK',
  400 => 'Bad Request',
  500 => 'Internal Server Error'
];
$req = (object) $_GET;

function setStatus($code){
  global $httpStatusCodes;

  header($_SERVER['SERVER_PROTOCOL'] .' '. $code .' '. $httpStatusCodes[$code], true, $code);
  header("Content-type: application/json; charset=utf-8");
}

function success($data){
  setStatus(200);
  echo json_encode($data);
  exit();
}

function error($code, $msg){
  setStatus($code);
  echo json_encode([
    'msg' => $msg
  ]);
  exit();
}

function getTemplates(){
  global $mdTemplates;
  $templatesList = [];

  foreach($mdTemplates as $path){
    $templates = glob("$path/*.hbs");

    foreach($templates as $template){
      $templatesList[pathinfo($template)['filename']] = file_get_contents($template);
    }
  }

  success([
    'templates' => $templatesList
  ]);
}

if( isset($req->action) ){
  switch( $req->action ){
    case 'getTemplates' :
      getTemplates();
      break;
  }
}else{
  error(400, "No action was set.");
}
