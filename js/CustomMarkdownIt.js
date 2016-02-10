function CustomMarkdownIt(markdownIt, opts){
  this.mdi = markdownIt(opts.mdOpts);
  this.origRender = this.mdi.render;
  this.CUST_RULE_START = '[';
  this.CUST_RULE_PROP = '|';
  this.headerLinks = undefined;
  this.plugins = {};
  this.customPlugins = {
    IMG_POP_UP: {
      name: 'ImgPopUp',
      template: '',
      func: this.inlineImgPopUp.bind(this),
      markup: '[imgPopUp:%IMAGE_THUMB%|%IMAGE_LARGE%|%EXTRA_CLASSES%]'
    },
    HTML5_VIDEO: {
      name: 'HTML5Video',
      template: '',
      func: this.inlineHTML5Video.bind(this),
      markup: '[html5Video:%WIDTH%|%HEIGHT%|%VID_PATH%|%VID_THUMB%|%VID_NAME%|mp4,ogv,webm]'
    },
    READ_MORE: {
      name: 'ReadMore',
      template: '',
      func: this.inlineReadMore.bind(this),
      markup: '[readMore:%LINK_TEXT%|%URL%]'
    },
    SLIDE_SHOW: {
      name: 'SlideShow',
      template: '',
      func: this.blockSlideShow.bind(this),
      markup:
        "\n\n"
        +"[slideShow:%WIDTH%|%HEIGHT%]\n"
        +"  %SLIDE_SHOW_IMG%\n"
        +"[/slideShow]"
        +"\n\n"
    },
    SLIDE_SHOW_IMG: {
      name: 'SlideShowImg',
      template: '',
      func: this.inlineSlideShowImg.bind(this),
      markup: '[slideShowImg:%IMAGE_NAME%|%TITLE%|%DURATION%|%ALIGN%|%BG_COLOR%]'
    }
  };
  this.onInit = opts.onInit || function(){};
  
  // overrides
  this.setBold();
  // interceptions
  this.interceptRule('heading_open', this.headingOpen);
  this.interceptRule('image', this.inlineImage);
  // plugins
  this.use( this.customPlugins.IMG_POP_UP );
  this.use( this.customPlugins.SLIDE_SHOW );
  this.use( this.customPlugins.SLIDE_SHOW_IMG );
  this.use( this.customPlugins.HTML5_VIDEO );
  this.use( this.customPlugins.READ_MORE );

  // get the plugin templates
  var _self = this;
  this.ajax({
    url: opts.SERVICE_URL,
    type: 'json',
    onSuccess: function(resp){
      _self.assignTemplatesToPlugins(resp.templates);
    },
    onError: function(resp){
      console.error(resp);
    }
  });
};

CustomMarkdownIt.prototype = {
  /**
   * This allows for grabbing the templates
   *
   * @param {Object} opts - The data required to make the request.
   */
  ajax: function(opts){
    var types = {
      TEXT: 'text',
      JSON: 'json'
    };

    if( !opts.type ) opts.type = '';
    if( !opts.onSuccess ) opts.onSuccess = function(){};
    if( !opts.onError ) opts.onError = function(){};

    if( window.XMLHttpRequest ){
      var xmlhttp = new XMLHttpRequest();

      xmlhttp.onreadystatechange = function(){
        if( xmlhttp.readyState == XMLHttpRequest.DONE ){
          var resp = xmlhttp.responseText;

          if(opts.type == types.JSON){
            resp = JSON.parse(resp);
          }

          if( xmlhttp.status == 200 ){
            opts.onSuccess(resp);
          }else{
            opts.onError({
              code: xmlhttp.status,
              msg: 'Could not make request for templates, browser unsupported.'
            });
          }
        }
      };

      xmlhttp.open(opts.type || 'GET', opts.url || '', true);
      xmlhttp.send();
    }else{
      opts.onError({
        code: 503,
        msg: 'Could not make request for templates, browser unsupported.'
      });
    }
  },

  /**
   * Loops through the provided list and associates the template with the
   * corresponding plugin Object.
   *
   * @param {Object} list - A list of templates that'll be used to render the
   * final markup.
   */
  assignTemplatesToPlugins: function(list){
    for( var i in list ){
      if( list.hasOwnProperty(i) ){
        for( var j in this.customPlugins ){
          if( this.customPlugins.hasOwnProperty(j) ){
            var currPlugin = this.customPlugins[j];

            if( i == 'MD_'+ currPlugin.name ){
              currPlugin.template = Handlebars.compile(list[i]);
            }
          }
        }
      }
    }

    this.onInit();
  },

  /**
   * Override strong tags
   */
  setBold: function(){
    this.mdi.renderer.rules.strong_open = function(){ return '<b>'; };
    this.mdi.renderer.rules.strong_close = function(){ return '</b>'; };
  },
  
  /**
   * The default attrPush doesn't allow for multiple operations.
   * The first push would be the only one that has any effect. This
   * method allows for multiple pushes to the same property.
   *
   * @param {Token} token - A markdown-it Token.
   * @param {Array} attrData - The attribute data, ex. ['class', 'icon-container'].
   */
  attrPush: function(token, attrData){
    if( token.attrs ){
      var ndx;
      
      // Check if the attribute already exists,
      // if it does, store the index, so it
      // can be updated.
      for( var i=0; i<token.attrs.length; i++ ){
        if( attrData[0] == token.attrs[i][0] ){
          ndx = i;
          break;
        }
      }
      
      if( ndx != undefined ){
        // Since the html parser strips out duplicate
        // entries we don't have to check if the same
        // value exists here.
        token.attrs[ndx][1] += ' '+ attrData[1];
      }else{
        token.attrs.push(attrData);
      }
    }else{
      token.attrs = [ attrData ];
    }
  },
  
  /**
   * Wraps a renderer rule so data can be manipulated before processing.
   *
   * @param {String} funcName - The name of the renderer function you want to intercept.
   * @param {Function} callback - This function will manipulate the data.
   */
  interceptRule: function(funcName, callback){
    var _self = this;
    var funcInst = _self.mdi.renderer.rules[funcName] || function(tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options);
    };
    
    _self.mdi.renderer.rules[funcName] = function wrappedCallback(tokens, idx, options, env, self){
      return callback.call(_self, funcInst, tokens, idx, options, env, self);
    }
  },
  
  /**
   * Converts a text character to it's Hex value.
   *
   * @param {String} input - The String you want converted.
   * @returns {Number}
   */
  charToHex: function(input){
    var output = '';
    for( var i=0, l=input.length; i<l; i++ ){
      output += '0x' + input.charCodeAt(i).toString(16).toUpperCase();
    }
    return +output;
  },
  
  /**
   * Gets useful data for the current line while parsing a Block.
   *
   * @param {State} state - A markdown-it State object.
   * @param {Number} startLine - The index for the current line in the block.
   * @returns {Object}
   */
  getBlockLineData: function(state, startLine){
    var lineStart = state.bMarks[startLine] + state.tShift[startLine];
    var lineEnd = state.eMarks[startLine];
    var currLine = state.src.substring(lineStart, lineEnd);
    
    return {
      startIndex: lineStart,
      endIndex: lineEnd,
      line: currLine
    };
  },
  
  /**
   * Overrides the render method allowing for additional data to be
   * set up before the rendering occurs.
   *
   * @param {String} plainText - The markdown text you want parsed.
   * @param {Object} env - The markdown-it config.
   * @returns {String}
   */
  render: function(plainText, env){
    // setup a cache for header links so custom pointers can be generated
    this.headerLinks = [];
    
    return this.origRender.call(this.mdi, plainText, env);
  },
  
  /**
   * Allows for adding plugins outside of this Class.
   *
   * @param {Function|Object} plugin - The function that sets up custom handling for
   * inline or block markdown text. If an Object is passed, then it's a custom
   * plugin which allows for adding extra functionality.
   */
  use: function(plugin){
    if( typeof plugin != 'function' ){
      var plgn = plugin;
      plugin = plugin.func;

      delete plgn.func;
      this.plugins[plgn.name] = plgn;
    }

    this.mdi.use(plugin);
  },

  /**
   * Parses and adds attributes to a matched token so you can add
   * attributes like `width`, `height`, `style`, `data`, etc.
   *
   * @param {object} token - The Object that'll store the attributes.
   * @param {string} line - The current line being parsed.
   * @returns {string}
   */
  parseAttributeData: function(token, line){
    var attrRegEx = /\{((?:[.#:;=\-"'\s\w]+))[^}]?/g;
    var attributeString;

    while( attributeString = attrRegEx.exec(line) ){
      var classes = [];
      var attributes = attributeString[1].match(/[^\s"]+(?:"[^"]*")?/g).filter(function(a){
        return a.trim() != '';
      });

      for( var i in attributes ){
        var attribute = attributes[i];

        if( attribute[0] === '#' ){
          this.attrPush(token, ['id', attribute.substr(1)]);
        }
        else if( attribute[0] === '.' ){
          classes.push( attribute.substr(1) );
        }
        else if( attribute.indexOf('=') > -1 ){
          var match = attribute.match(/([\w-]+)="?([\D\w-]+)"?/);

          if( match ) this.attrPush(token, [match[1], match[2]]);
        }
      }

      if( classes.length ){
        this.attrPush(token, ['class', classes.join(' ')]);
      }

      line = (line.substr(0, attributeString.index) + line.substr(attrRegEx.lastIndex+1)).trim();
    }

    return line;
  },

  /**
   * Intercepts the standard `heading_open` rule and adds links to H tags
   * and attributes if set.
   *
   * @param {Function} funcInst - The intercepted function.
   * @param {Array} tokens - Pass-through Token arg.
   * @param {Number} idx - Pass-through Token arg.
   * @param {Object} options - Pass-through Token arg.
   * @param {Object} env - Pass-through Token arg.
   * @param {Object} self - Pass-through Token arg.
   * @returns {String} - HTML markup.
   */
  headingOpen: function(funcInst, tokens, idx, options, env, self){
    var openToken = tokens[idx];
    var inlineToken = tokens[ idx+1 ];
    var linkPointer = inlineToken.content.toLowerCase().replace(/[^\w]+/g, '-');
    var linkSuffix = '';

    inlineToken.content = this.parseAttributeData(openToken, inlineToken.content);

    this.attrPush(openToken, ['class', 'md-header']);
    
    // loop over current headers to see if there are duplicates
    for( var i=0; i<this.headerLinks.length; i++ ){
      var link = this.headerLinks[i];
      var match = link.match(new RegExp('^'+ linkPointer +'(?:-(\\d+))?$'));
      
      if( match ){
        var count = ( match[1] ) ? (+match[1])+1 : 1;
        linkSuffix = '-'+ count;
      }
    }
    linkPointer += linkSuffix;
    this.headerLinks.push( linkPointer );
    
    inlineToken.content =
      '<a name="'+ linkPointer +'" class="md-header__link" href="#'+ linkPointer +'">'
        +'<span class="md-header__link-icon"></span>'
      +'</a>'
      + inlineToken.content;
    // this may have unwanted side effects when nested
    inlineToken.children[0].content = inlineToken.content;
    inlineToken.children[0].type = 'html_inline';

    return funcInst(tokens, idx, options, env, self);
  },

  /**
   * Intercepts the standard `image` rule and adds attributes if set.
   *
   * @param {Function} funcInst - The intercepted function.
   * @param {Array} tokens - Pass-through Token arg.
   * @param {Number} idx - Pass-through Token arg.
   * @param {Object} options - Pass-through Token arg.
   * @param {Object} env - Pass-through Token arg.
   * @param {Object} self - Pass-through Token arg.
   * @returns {String} - HTML markup.
   */
  inlineImage: function(funcInst, tokens, idx, options, env, self){
    var openToken = tokens[idx];
    var inlineToken = tokens[ idx+1 ];

    if( inlineToken ){
      inlineToken.content = this.parseAttributeData(openToken, inlineToken.content);
    }

    return funcInst(tokens, idx, options, env, self);
  },
  
  /**
   * Takes the current inline text and tokenizes it via the custom
   * patterns that have been set up.
   *
   * @param {State} state - A markdown-it State Object.
   * @param {Boolean} silent - Based on `ParserInline.prototype.tokenize` it's always false.
   * @param {Object} opts - Custom options specific to the current inline Rule.
   * @returns {Boolean}
   */
  inlineTokenParser: function(state, silent, opts){
    var _self = this;
    var currPos = state.pos;
    var matches = state.src.match(opts.tokenRegEx);
    var token, match, ndx;
    
    if(
      silent 
      || !matches 
      || state.src.charCodeAt(currPos) !== _self.charToHex( _self.CUST_RULE_START )
    ) return false;
    
    if( !state.matchIndex ) state.matchIndex = 0;
    
    var ndx = state.matchIndex;
    var match = ( matches[ndx] )
      ? matches[ndx].match(opts.tokenRegEx.source)
      : null;
    
    if( match ){
      token = state.push(opts.ruleName, '');
      token.markup = match[0];
      token.props = ( match[1] ) ? match[1].split( _self.CUST_RULE_PROP ) : null;
      
      var matchPos = state.src.indexOf( match[0] );
      var offset = ( state.pos === 0 && matchPos !== 0 ) ? matchPos : 0;
      
      state.pos = state.pos + offset + match[0].length;
      state.matchIndex++;
    }
    
    // All tokens for this block have been processed
    // proceed to the next Token.
    if( state.matchIndex === matches.length ){
      return true;
    }
  },
  
  /**
   * Takes the current block text and tokenizes it via the custom
   * patterns that have been set up.
   *
   * @param {State} state - A markdown-it State Object.
   * @param {Number} startLine - The index of the current line.
   * @param {Number} endLine - The index of the last line.
   * @param {Boolean} silent - Whether the sequence is a terminator.
   * @param {Object} opts - Custom options specific to the current block Rule.
   */
  blockTokenParser: function(state, startLine, endLine, silent, opts){
    var _self = this;
    var lineData = _self.getBlockLineData(state, startLine);
    var token, match;
    
    // If not starting a block, don't process.
    if(
      !opts.tokenStartRegEx.test(lineData.line)
    ) return false;
    
    var match = lineData.line.match(opts.tokenStartRegEx);
    var currIndex = startLine;
    var endIndex = endLine;
    
    // Start of block found, loop through lines until end of block found.
    while( currIndex < endIndex ){
      lineData = _self.getBlockLineData(state, currIndex);
      
      // If end of block, stop.
      if( opts.tokenEndRegEx.test(lineData.line) ){
        currIndex++;
        endIndex = currIndex;
        break;
      }
      
      currIndex++;
    }
    
    state.line = endIndex;
    
    token           = state.push(opts.ruleName +'_open', '', 1);
    token.map       = [ startLine, state.line ];
    token.props     = ( match[1] ) ? match[1].split( _self.CUST_RULE_PROP ) : null;

    token           = state.push('inline', '', 0);
    token.content   = state.getLines(startLine, endIndex, 0, false).trim();
    token.map       = [ startLine, state.line ];
    token.children  = [];

    token           = state.push(opts.ruleName +'_close', '', -1);
    
    return true;
  },
  
  
  // == Plugins ================================================================
  
  
  inlineReadMore: function(md){
    var _self = this;
    var ruleName = 'read_more';
    // greedy and multiline are required because blobs are being returned
    // instead of single lines, which is strange for an inline rule.
    var tokenRegEx = /\[readMore:?([^\]]+)?\]/gm;
    
    // setup regex/tokenizer
    md.inline.ruler.push(ruleName, function cust_readMore(state, silent){
      return _self.inlineTokenParser(state, silent, {
        ruleName: ruleName,
        tokenRegEx: tokenRegEx
      });
    });
    
    // renders token if found
    md.renderer.rules[ruleName] = function(tokens, idx, options, env, self){
      var token = tokens[idx];
      var model = {};
      
      if( token.props ){
        if( token.props[0] ) model.text = token.props[0];
        if( token.props[1] ) model.href = token.props[1];
      }
      
      return _self.customPlugins.READ_MORE.template( model );
    };
  },

  inlineImgPopUp: function(md){
    var _self = this;
    var ruleName = 'img_pop_up';
    var tokenRegEx = /^(?:\s+)?\[imgPopUp:?([^\]]+)\]/gm;

    // setup regex/tokenizer
    md.inline.ruler.push(ruleName, function cust_imgPopUp(state, silent){
      return _self.inlineTokenParser(state, silent, {
        ruleName: ruleName,
        tokenRegEx: tokenRegEx
      });
    });

    // renders token if found
    md.renderer.rules[ruleName] = function(tokens, idx, options, env, self){
      var token = tokens[idx];
      var model = {
        data: {}
      };

      if( token.props ){
        var tProps = token.props;

        if( tProps[0] ) model.imgPathThumb = tProps[0];
        if( tProps[1] ) model.imgPathLarge = tProps[1];
        if( tProps[2] ) model.classes = tProps[2];
      }

      return _self.customPlugins.IMG_POP_UP.template( model );
    };
  },

  inlineHTML5Video: function(md){
    var _self = this;
    var ruleName = 'html5_video';
    var tokenRegEx = /^(?:\s+)?\[html5Video:?([^\]]+)\]/gm;

    // setup regex/tokenizer
    md.inline.ruler.push(ruleName, function cust_html5Video(state, silent){
      return _self.inlineTokenParser(state, silent, {
        ruleName: ruleName,
        tokenRegEx: tokenRegEx
      });
    });

    // renders token if found
    md.renderer.rules[ruleName] = function(tokens, idx, options, env, self){
      var token = tokens[idx];
      var model = {
        data: {}
      };

      if( token.props ){
        var tProps = token.props;

        if( tProps[0] ) model.vidWidth = tProps[0];
        if( tProps[1] ) model.vidHeight = tProps[1];
        if( tProps[5] ){
          model.vidPath = ( tProps[2] )
            ? tProps[2]
            : '';
          model.vidThumb = ( tProps[3] )
            ? model.vidPath +'/'+ tProps[3]
            : '';

          var exts = tProps[5].split(',');
          if( exts.length ){
            var fileName = ( tProps[4] ) ? tProps[4] : '';
            model.sources = {};

            for(var i=0; i<exts.length; i++){
              var ext = exts[i];
              var key = ( ext == 'ogv' ) ? 'ogg' : ext;

              model.sources[key] = {
                vidSrc: model.vidPath +'/'+ fileName +'.'+ ext
              };
            }
          }
        }
      }

      return _self.customPlugins.HTML5_VIDEO.template( model );
    };
  },

  inlineSlideShowImg: function(md){
    var _self = this;
    var ruleName = 'slide_show_img';
    var tokenRegEx = /^(?:\s+)?\[slideShowImg:?([^\]]+)\]/gm;
    
    // setup regex/tokenizer
    md.inline.ruler.push(ruleName, function cust_slideShowImg(state, silent){
      return _self.inlineTokenParser(state, silent, {
        ruleName: ruleName,
        tokenRegEx: tokenRegEx
      });
    });
    
    // renders token if found
    md.renderer.rules[ruleName] = function(tokens, idx, options, env, self){
      var token = tokens[idx];
      var model = {
        data: {}
      };
      
      if( token.props ){
        var tProps = token.props;
        
        if( tProps[0] ) model.src = tProps[0];
        if( tProps[1] ){
          model.alt = tProps[1];
          model.title = tProps[1];
          model.data.title = tProps[1];
        }
        if( tProps[2] ) model.data.duration = tProps[2];
        if( tProps[3] ) model.data.align = tProps[3];
        if( tProps[4] ) model.data.bgColor = tProps[4];
      }
      
      return _self.customPlugins.SLIDE_SHOW_IMG.template( model );
    };
  },
  
  blockSlideShow: function(md){
    var _self = this;
    var ruleName = 'slide_show';
    var tokenStartRegEx = /^\[slideShow[^Img]:?([^\]]+)\]$/;
    var tokenEndRegEx = /^\[\/slideShow\]$/;
    
    md.block.ruler.before('paragraph', ruleName, function cust_slideShow(state, startLine, endLine, silent){
      return _self.blockTokenParser(state, startLine, endLine, silent, {
        ruleName: ruleName,
        tokenStartRegEx: tokenStartRegEx,
        tokenEndRegEx: tokenEndRegEx
      });
    }, { alt: [ 'paragraph' ] });
    
    md.renderer.rules[ruleName +'_open'] = function(tokens, idx, options){
      var token = tokens[idx];
      var model = {
        blockStart: true,
        data: {}
      };
      
      if( token.props ){
        var tProps = token.props;
        
        if( tProps[0] ) model.data.width = tProps[0];
        if( tProps[1] ) model.data.height = tProps[1];
      }
      
      return _self.customPlugins.SLIDE_SHOW.template( model );
    };
    md.renderer.rules[ruleName +'_close'] = function(){
      return _self.customPlugins.SLIDE_SHOW.template( {} );
    };
  }
};