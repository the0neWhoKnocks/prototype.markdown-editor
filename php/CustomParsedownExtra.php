<?php

require_once('Handlebars.php');
require_once('Parsedown.php');
require_once('ParsedownExtra.php');

class CustomParsedownExtra extends ParsedownExtra{

  /**
   * @param Object $opts - Any options for the Class
   */
  function __construct($opts){
    $this->InlineTypes['['][] = 'ImgPopUp';
    $this->InlineTypes['['][] = 'HTML5Video';
    $this->InlineTypes['['][] = 'ReadMore';
    $this->InlineTypes['['][] = 'SlideShowImg';
    $this->addToMarkerList('[');
    
    $this->BlockTypes['['][] = 'SlideShow';

    $this->Handlebars = new Handlebars([
      'templatePaths' => $opts->templateDirs
    ]);
  }
  
  protected function addToMarkerList($str){
    if( strrpos($this->inlineMarkerList, $str) !== false ){
      $this->inlineMarkerList .= $str;
    }
  }
  
  // parse args if they were passed
  protected function parseArgs($arr){
    if( isset( $arr[1] ) ){
      $args = explode('|', $arr[1]);
      
      if( count($args) ){
        return $args;
      }
    }
    
    return false;
  }
  
  public function text($plainText){
    $this->headerLinks = [];
    
    return parent::text($plainText);
  }

  protected function inlineImgPopUp($Line){
    if( preg_match('/^\[imgPopUp:?([^\]]+)\]/', $Line['text'], $matches) ){
      $model = [
        'data' => []
      ];

      if( $args = $this->parseArgs($matches) ){
        if( !empty($args[0]) ) $model['imgPathThumb'] = $args[0];
        if( !empty($args[1]) ) $model['imgPathLarge'] = $args[1];
        if( !empty($args[2]) ) $model['classes'] = $args[2];
      }

      return [
        'extent' => strlen($matches[0]),
        'markup' => $this->Handlebars->render('MD_ImgPopUp', $model)
      ];
    }
  }

  protected function inlineHTML5Video($Line){
    if( preg_match('/^\[html5Video:?([^\]]+)\]/', $Line['text'], $matches) ){
      $model = [
        'data' => []
      ];

      if( $args = $this->parseArgs($matches) ){
        if( !empty($args[0]) ) $model['vidWidth'] = $args[0];
        if( !empty($args[1]) ) $model['vidHeight'] = $args[1];
        if( !empty($args[5]) ){
          $model['vidPath'] = ( !empty($args[2]) )
            ? $args[2]
            : '';
          $model['vidThumb'] = ( !empty($args[3]) )
            ? $model['vidPath'] .'/'. $args[3]
            : '';

          $exts = explode(',', $args[5]);
          if( count($exts) ){
            $fileName = ( !empty($args[4]) ) ? $args[4] : '';
            $model['sources'] = [];

            for($i=0; $i<count($exts); $i++){
              $ext = $exts[$i];
              $key = ( $ext == 'ogv' ) ? 'ogg' : $ext;

              $model['sources'][$key] = [
                'vidSrc' => $model['vidPath'] .'/'. $fileName .'.'. $ext
              ];
            }
          }
        }
      }

      return [
        'extent' => strlen($matches[0]),
        'markup' => $this->Handlebars->render('MD_HTML5Video', $model)
      ];
    }
  }

  protected function inlineReadMore($Line){
    if( preg_match('/^\[readMore:?([^\]]+)?\]/', $Line['text'], $matches) ){
      $model = [];

      if( $args = $this->parseArgs($matches) ){
        if( !empty($args[0]) ) $model['text'] = $args[0];
        if( !empty($args[1]) ) $model['href'] = $args[1];
      }
      
      return [
        'extent' => strlen($matches[0]),
        'markup' => $this->Handlebars->render('MD_ReadMore', $model)
      ];
    }
  }
  
  protected function inlineSlideShowImg($Line){
    if( preg_match('/^\[slideShowImg:?([^\]]+)\]/', $Line['text'], $matches) ){
      $model = [
        'data' => []
      ];
      
      if( $args = $this->parseArgs($matches) ){
        if( !empty($args[0]) ) $model['src'] = $args[0];
        if( !empty($args[1]) ){
          $model['alt'] = $args[1];
          $model['title'] = $args[1];
          $model['data']['title'] = $args[1];
        }
        if( !empty($args[2]) ) $model['data']['duration'] = $args[2];
        if( !empty($args[3]) ) $model['data']['align'] = $args[3];
        if( !empty($args[4]) ) $model['data']['bgColor'] = $args[4];
      }

      return [
        'extent' => strlen($matches[0]),
        'markup' => $this->Handlebars->render('MD_SlideShowImg', $model)
      ];
    }
  }
  
  protected function blockSlideShow($Line){
    if( preg_match('/^\[slideShow[^Img]:?([^\]]+)\]$/', $Line['text'], $matches) ){
      $model = [
        'blockStart' => true,
        'data' => []
      ];
      
      if( $args = $this->parseArgs($matches) ){
        if( !empty($args[0]) ) $model['data']['width'] = $args[0];
        if( !empty($args[1]) ) $model['data']['height'] = $args[1];
      }

      return [
        'element' => [
          'handler' => 'line',
          'text' => '',
          'markup_open' => $this->Handlebars->render('MD_SlideShow', $model),
          'markup_close' => $this->Handlebars->render('MD_SlideShow', [])
        ]
      ];
    }
  }

  protected function blockSlideShowContinue($Line, $Block){
    if( isset($Block['complete']) ) return;

    if( isset($Block['interrupted']) ){
      $Block['element']['text'] .= "\n";
      unset($Block['interrupted']);
    }

    if( preg_match('/^\[\/slideShow\]$/', $Line['text']) ){
      $Block['complete'] = true;
      return $Block;
    }

    $Block['element']['text'] .= "\n".$Line['body'];

    return $Block;
  }
  
  protected function blockHeader($Line){
    $Block = parent::blockHeader($Line);
    $headerText = $Block['element']['text'];
    $linkPointer = preg_replace( '/[^\w]+/', '-', strtolower($headerText) );
    $linkSuffix = '';
    
    // add attributes to main tag
    if(
      isset($Block['element']['attributes'])
      && isset($Block['element']['attributes']['class'])
    ){
      $Block['element']['attributes']['class'] .= ' md-header';
    }else{
      $Block['element']['attributes'] = [
        'class' => 'md-header'
      ];
    }
    
    // loop over current headers to see if there are duplicates
    for( $i=0; $i<count($this->headerLinks); $i++ ){
      $link = $this->headerLinks[$i];
      preg_match( '/^'. $linkPointer .'(?:-(\d+))?$/', $link, $match);
      
      if( count($match) ){
        $count = ( isset($match[1]) ) ? intval($match[1]) + 1 : 1;
        $linkSuffix = "-$count";
      }
    }
    $linkPointer .= $linkSuffix;
    $this->headerLinks[] = $linkPointer;
    
    // wrap inner text
    $Block['element']['text'] =
      '<a name="'. $linkPointer .'" class="md-header__link" href="#'. $linkPointer .'">'
        .'<span class="md-header__link-icon"></span>'
      .'</a>'
      .$headerText;
    
    return $Block;
  }

  /**
   * Basically a dupe of `element` but no dynamic elements will be generated,
   * instead it'll allow for passing in already rendered markup, like the Inline
   * rules do.
   *
   * @param array $Element
   * @return string
   */
  protected function element(array $Element){
    if( !isset($Element['markup_open']) ){
      return parent::element($Element);
    }else{
      $markup = $Element['markup_open'];

      if( isset($Element['handler']) ){
        $markup .= $this->{$Element['handler']}($Element['text']);
      }else{
        $markup .= $Element['text'];
      }

      $markup .= $Element['markup_close'];

      return $markup;
    }
  }
}