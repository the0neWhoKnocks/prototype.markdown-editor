<?

require_once('./conf.php');

$fileQueryParam = 'fn';
$defaultFile = 'cheetsheet';
$mdDir = './md';
$mdFiles = [];

foreach(scandir($mdDir) as $fileName){
  if( $fileName != '.' && $fileName != '..' ){
    $mdFiles[str_replace('.md', '', $fileName)] = "$mdDir/$fileName";
  }
}
// sort alphabetically, ignore case
uksort($mdFiles, function($a, $b){
  return strcasecmp($a, $b);
});

if( !empty($_POST) ){
  $fileKey = $_POST['fileName'];
  
  if( !empty($_POST['newFile']) ){
    $filename = $_POST['newFile'];
    $filepath = "$mdDir/$filename";
    $files = glob("$filepath*.md");
    $inc = '';
    
    // If there's more than one file, assume that we've already
    // applied the duplicate naming schema, so use the last file
    // to determine the increment.
    if( count($files) > 1 ){
      $inc = '_000'; // placeholder value
      $file = end($files);
      
      if( preg_match('/_(\d{3}).md$/', $file, $match) ){
        $count = intval($match[1]) + 1;
        $inc = substr_replace($inc, $count, -strlen($count));
      }
    }else if( count($files) === 1 ){
      $inc = '_001';
    }
    
    $filepath = "$filepath$inc.md";
    $_SERVER['QUERY_STRING'] = "$fileQueryParam=$filename$inc";
  }else{
    $filepath = $mdFiles[$fileKey];
  }
  
  file_put_contents( $filepath, $_POST['content'] );
  
  header('Location:'.$_SERVER['HTTP_REFERER']);
  die;

}else{
  require_once('./php/CustomParsedownExtra.php');
  
  $fileKey = ( 
    isset($_GET[$fileQueryParam])
    && array_key_exists( $_GET[$fileQueryParam], $mdFiles )
  ) ? $_GET[$fileQueryParam] : $defaultFile;

  $pdExtra = new CustomParsedownExtra((object) [
    'templateDirs' => $mdTemplates
  ]);
  
  $loadedContent = file_get_contents( $mdFiles[$fileKey] );
  
?>
<!DOCTYPE html>
<html lang="en-US">
<head>
  <title>Markdown Test</title>

  <link rel="stylesheet" href="css/highlight.v9.0.0.custom.sunburst.css">
  <link rel="stylesheet" href="css/app.css">
  
  <script src="js/handlebars-v3.0.0.min.js"></script>
  <script src="js/highlight.v9.0.0.min.js"></script>
  <script src="js/markdown-it.js"></script>
  <script src="js/CustomMarkdownIt.js"></script>
  <script src="js/app.js"></script>
</head>
<body>
  <div class="root">
    <form class="editor" name="markdown-form" action="" method="POST" enctype="multipart/form-data" data-file-query-param="<? echo $fileQueryParam; ?>">
      <div class="editor__file-selector-container">
        <h3 class="section-title">Dynamic JS Editor</h3>
        <select id="fileSelect" class="editor__file-selector" name="fileName">
        <?
          foreach($mdFiles as $key=>$val){
            $selected = ( $key == $fileKey ) ? ' selected' : '';
            echo "<option class='editor__file-option' value='$key'$selected>$key</option>";
          }
        ?>
        </select>
        <input id="newFileInput" class="editor__new-file" type="text" name="newFile" placeholder="New file name">
      </div>
      <div class="editor__plugins js-editorPlugins"></div>
      <textarea 
        id="edtTextArea" 
        name="content" 
        autofocus
      ><? echo htmlspecialchars($loadedContent); ?></textarea
      ><div 
        id="edtPreview" 
        class="editor-preview"
      ></div>
      <button type="submit" id="saveBtn" class="editor__save-btn" disabled>Save</button>
    </form>
    
    <div class="php-md-render">
      <h3 class="section-title">Server-Side PHP Render</h3>
      <div id="phpRender" class="php-md-render__inner">
        <? echo $pdExtra->text($loadedContent); ?>
      </div>
    </div>
  </div>
</body>
</html>

<? } ?>

