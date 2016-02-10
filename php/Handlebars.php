<?php
/** Handlebars */

require_once('lightncandy.php');

/**
 * Normalizes lightncandy functionality
 *
 * @package util\Handlebars
 * @author  Trevor Lemon
 */
class Handlebars {

  /**
   * Constructor for Handlebars
   * @param Array|Object $opts - dynamic options that need to be set on a case by case basis.
   */
  public function __construct($opts){
    $opts = (object) $opts;

    $this->config = (object) array(
      'flags' =>
        // https://github.com/zordius/lightncandy#compile-options
        LightnCandy::FLAG_BESTPERFORMANCE
        // support objects in model
        | LightnCandy::FLAG_PROPERTY
        // support ~ trim property
        | LightnCandy::FLAG_SPACECTL
        // compile partial as runtime function, This enables recursive
        // partials or context change for partials
        | LightnCandy::FLAG_RUNTIMEPARTIAL
        // if a partial doesn't exist, don't error out
        | LightnCandy::FLAG_ERROR_SKIPPARTIAL
        // support special variables include @root, @index, @key, @first, @last.
        | LightnCandy::FLAG_SPVARS,
      // searches by extension order
      'fileext' => array('.hbs'),
      // searches for templates/partials by path order
      'basedir' => $opts->templatePaths
    );
  }

  public function render($templateName, $model){
    // loop over provided paths and find template, will use the last one it finds
    // normally this will be the base or theme template.

    foreach( $this->config->basedir as $path ){
      if( is_file("$path/$templateName.hbs") ){
        $template = "$path/$templateName.hbs";
      }
    }

    // if no template was found, serve up a 404
    /*if( !isset($template) ){
      foreach( $this->config->basedir as $path ){
        if( is_file("$path/404.hbs") ){
          $template = "$path/404.hbs";
        }
      }
    }*/

    $phpTemplate = LightnCandy::compile(
      file_get_contents($template),
      (array) $this->config
    );
    $renderer = LightnCandy::prepare($phpTemplate);

    return $renderer( $model );
  }
}