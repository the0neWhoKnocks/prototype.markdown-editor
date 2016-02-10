var md, edtTextArea, edtPreview, fileSelect, newFileInput, saveBtn, body,
dataLossPromptAdded = false, unsavedChanges = false;

function debounce(el, int, callback){
  if( el.dataset.debounce ) clearTimeout(el.dataset.debounce);
  
  el.dataset.debounce = setTimeout(function(){
    if( callback ) callback();
  }, int);
}

function addClass(cl, el){
  el.className = ( el.className != '' )
    ? el.className +' '+ cl
    : cl;
}

function hasClass(el, cl){
  return (' ' + el.className + ' ').indexOf(' ' + cl + ' ') > -1;
}

function renderMarkdown(source, output){
  // parse text on load
  output.innerHTML = md.render(source.value);
  
  addCodeHighlighting(output);
  initPlugins();
}

function addCodeHighlighting(outputEl){
  var codeBlocks = outputEl.querySelectorAll('pre code');
  
  // highlight code text
  for( var i=0; i<codeBlocks.length; i++ ){
    var block = codeBlocks[i];
    var lang = block.className.match(/lang(?:uage)?-(\w+)/);
    
    // wrap code
    hljs.highlightBlock( block );
    // add data for styling
    if( lang && lang.length ){
      addClass('code-block', block.parentNode);
      block.parentNode.dataset.lang = lang[1];
    }
  }
}

function handleUnsavedChanges(){
  if( unsavedChanges ){
    return "All changes will be lost if you continue.";
  }
}

function handleFormChanges(ev){
  // don't update if the keys are up, down, left, or right
  if( ev.keyCode < 37 || ev.keyCode > 40 ){
    if( ev.target == edtTextArea ){
      debounce(edtTextArea, 300, renderMarkdown.bind(null, edtTextArea, edtPreview));
    }
    
    if( !dataLossPromptAdded ){
      window.onbeforeunload = handleUnsavedChanges;
      dataLossPromptAdded = true;
      unsavedChanges = true;
      saveBtn.disabled = false;
    }
  }
}

function handlePluginClick(ev){
  // the button will gain focus otherwise.
  ev.preventDefault();

  var markup = md.plugins[ ev.target.dataset.type ].markup;

  insertTextAtCursor(edtTextArea, markup);
}

function insertTextAtCursor(el, text){
  // only process if the specified el has focus
  if( document.activeElement === el ){
    var val = el.value, endIndex, range;

    if(
      typeof el.selectionStart != 'undefined'
      && typeof el.selectionEnd != 'undefined'
    ){
      endIndex = el.selectionEnd;
      el.value = val.slice(0, el.selectionStart) + text + val.slice(endIndex);
      el.selectionStart = el.selectionEnd = endIndex + text.length;
    }else if(
      typeof document.selection != 'undefined'
      && typeof document.selection.createRange != 'undefined'
    ){
      el.focus();
      range = document.selection.createRange();
      range.collapse(false);
      range.text = text;
      range.select();
    }
  }else{
    alert("The textarea doesn't have focus so text can't be inserted.");
  }
}

function setupSlideShows(els){
  for(var i=0; i<els.length; i++){
    var slideShow = els[i];
    
    slideShow.style.width = slideShow.dataset.width +'px';
    slideShow.style.height = slideShow.dataset.height +'px';
  }
}

function handleImgPopUp(ev){
  alert('Open pop up for "'+ ev.target.dataset.srcLarge +'"');
}

function initPlugins(){
  setupSlideShows(document.querySelectorAll('.js-slideShow'));

  // delegated events
  if( !body.dataset.pluginDelegatesAdded ){
    body.addEventListener('click', function(ev){
      //console.log(ev.target, hasClass(ev.targer, ''));

      if( hasClass(ev.target, 'js-imgPopUp') ){
        handleImgPopUp(ev);
      }
    });

    body.dataset.pluginDelegatesAdded = true;
  }
}

function setupPluginBtns(){
  var container = document.querySelector('.js-editorPlugins');
  var pluginBtns = '', i;

  // setup markup
  for(i in md.plugins){
    if( md.plugins.hasOwnProperty(i) ){
      var plugin = md.plugins[i];
      pluginBtns += '<button type="button" class="editor__plugin-btn js-editorPluginBtn" data-type="'+ plugin.name +'">'+ plugin.name +'</button>';
    }
  };
  container.innerHTML = pluginBtns;

  // setup listeners
  pluginBtns = document.querySelectorAll('.js-editorPluginBtn');
  for(i=0; i<pluginBtns.length; i++){
    pluginBtns[i].addEventListener('mousedown', handlePluginClick);
  }
}

document.addEventListener('DOMContentLoaded', function(ev) {
  body = document.querySelector('body');
  edtTextArea = document.getElementById('edtTextArea');
  edtPreview = document.getElementById('edtPreview');
  fileSelect = document.getElementById('fileSelect');
  newFileInput = document.getElementById('newFileInput');
  saveBtn = document.getElementById('saveBtn');
  md = new CustomMarkdownIt(window.markdownit, {
    mdOpts: {
      html: true,
      linkify: true,
      //langPrefix: 'lang-'
    },
    SERVICE_URL: location.origin+location.pathname+'php/api.php?action=getTemplates',
    onInit: function(){
      // parse & highlight code text after load
      renderMarkdown(edtTextArea, edtPreview);
      addCodeHighlighting(document.getElementById('phpRender'));

      // setup the editor GUI
      setupPluginBtns();

      // add listeners
      edtTextArea.addEventListener('keyup', handleFormChanges);
      newFileInput.addEventListener('keyup', handleFormChanges);
    }
  });

  fileSelect.addEventListener('change', function(ev){
    var param = document.forms['markdown-form'].dataset.fileQueryParam;
    location.search = param +'='+ ev.target.value;
  });

  document.forms['markdown-form'].onsubmit = function(ev){
    unsavedChanges = false;
  }
});