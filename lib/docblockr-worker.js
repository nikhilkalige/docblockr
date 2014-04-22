/*{View} = require 'atom'

#module.exports =
#class DocblockrView extends View
#  @content: ->
#    @div class: 'docblockr overlay from-top', =>
#      @div "The Docblockr package is Alive! It's ALIVE!", class: "message"
#
#  initialize: (serializeState) ->
#    atom.workspaceView.command "docblockr:toggle", => @toggle()
#    atom.editorView.command "docblockr:expand", => @expand()

  # Returns an object that can be retrieved when package is activated
  #serialize: ->

  # Tear down any state and detach
#  destroy: ->
#    @detach()

 # toggle: ->
  #  console.log "DocblockrView was toggled!"
   # if @hasParent()
    #  @detach()
    #else
    #  atom.workspaceView.append(this)

  #expand: ->
  #  console.log 'Docblockr:Expand'
*/


/*  class DocblockrAtom extends View
    initialize: ->
      console.log 'Initialize'
      #atom.workspaceView.command "docblockr:toggle", => @toggle()

    logger: ->
      console.log 'tester'
*/
var DocsParser = require('../temp.js')
var DocBlockrAtom;
module.exports =
  // Class docblockatom
  DocBlockrAtom = (function() {

    function DocBlockrAtom() {
      var self = this;
      console.log ('Constructor');
      // The docs module should be initiated here
      // var docblokr = new dockblokr(config);
      atom.workspaceView.command('docblockr:toggle', function() {
        self.toggle();
      });
    }

    DocBlockrAtom.prototype.init = function() {
      console.log('init');
    }

    DocBlockrAtom.prototype.toggle = function() {
      console.log('toggle');
      // TODO: Need to modify this
      var inline = false;
      var editor = atom.workspace.getActiveEditor();
      if (typeof editor === "undefined" || editor === null) {
        return;
      }
      // get preceding text
      var cursor_position = editor.getCursorBufferPosition(); // will handle only one instance
      var preceding_text = editor.getTextInBufferRange([[cursor_position.row, 0], cursor_position]);
      console.log('Preceding Text= ' + preceding_text);
      // Match /**
      if(preceding_text.search(/^\s*(\/\*|###)[*!]\s*$/) < 0) {
        return;
      }

      // Get trailing string
      var line_length = editor.lineLengthForBufferRow(cursor_position.row);
      this.trailing_string = editor.getTextInBufferRange([cursor_position, [cursor_position.row, line_length]]);
      // drop trailing */
      this.trailing_string = this.trailing_string.replace(/\s*\*\/\s*$/, '');
      this.trailing_string = escape(this.trailing_string);

      this.parser = parser = this.get_parser(editor);
      parser.inline = inline;

      // use trailing string as a description of the function
      if(this.trailingString)
          parser.setNameOverride(this.trailingString);

      // read the next line
      cursor_position = cursor_position.copy();
      cursor_position.row+= 1;
      this.line = parser.get_definition(editor, cursor_position);
      console.log('self.line =' + this.line);

    }

    DocBlockrAtom.prototype.escape = function(string) {
      return string.replace('$', '\\$').replace('{', '\\{').replace('}', '\\}')
    }

    DocBlockrAtom.prototype.get_parser = function(editor) {
      var scope = editor.getGrammar().scopeName;
      var regex = /\bsource\.([a-z+\-]+)/;
      var matches = regex.exec(scope);
      var source_lang = (matches === null)? 'js': matches[1];

      var settings = atom.config.getSettings().docblockr;
      /*
      if(source_lang === "php")
          return PhpParser(settings);
      else if(source_lang === "coffee")
          return CoffeeParser(settings);
      else if((source_lang === "actionscript") || (source_lang == 'haxe'))
          return ActionscriptParser(settings);
      else if((source_lang === "c++") || (source_lang === 'c') || (source_lang === 'cuda-c++'))
          return CppParser(settings);
      else if((source_lang === 'objc') || (source_lang === 'objc++'))
          return ObjCParser(settings);
      else if((source_lang === 'java') || (source_lang === 'groovy'))
          return JavaParser(settings);
      else if(source_lang === 'rust')
          return RustParser(settings);
      else if(source_lang === 'ts')
          return TypescriptParser(settings);*/
      return new DocsParser.JsParser(settings);
    }

    return DocBlockrAtom;
  })();
