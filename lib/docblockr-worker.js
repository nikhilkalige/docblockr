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
'use strict';
var DocsParser = require('../temp.js');
var snippet = require('snippets');
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
      // TODO: Need to modify this
      //var inline = false;
      var editor = atom.workspace.getActiveEditor();
      if (typeof editor === "undefined" || editor === null) {
        return;
      }
      this.initialize(editor);
      if(this.parser.is_existing_comment(this.line)) {
        write(editor, "\n *" + this.indentSpaces);
        return;
      }
      
      // erase characters in the view (will be added to the output later)
      this.erase(editor, self.trailing_range);

      // match against a function declaration.
      // TODO: skip temporrarily
      //out = this.parser.parse(self.line)
      snippet = self.generateSnippet(out, inline)
    }

    DocBlockrAtom.prototype.initialize = function(editor, inline) {
      inline = (typeof inline === 'undefined') ? false : inline;
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
      this.trailing_range = [cursor_position, [cursor_position.row, line_length]];
      this.trailing_string = editor.getTextInBufferRange(this.trailing_range);
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

    DocBlockrAtom.prototype.write = function(editor, str) {
      // will insert data at last cursor position
      snippet.insert(str, editor);
      /*view.run_command(
          'insert_snippet', {
              'contents': str
          }
      */
    }

    DocBlockrAtom.prototype.erase = function(editor, range) {
      var buffer = editor.getBuffer();
      buffer.delete(range);
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

    DocBlockrAtom.prototype.generate_snippet = function(out, inline) {
      //# substitute any variables in the tags
      if(out) 
        out = this.substituteVariables(out);

      // align the tags
      if(out && (this.shallowAlignTags || this.deepAlignTags) && (!inline))
        out = this.align_tags(out);

      // fix all the tab stops so they're consecutive
      if(out)
        out = this.fix_tab_stops(out);

      if(inline) {
        if(out) 
          return (' ' + out[0] + ' */');
        else
          return (' $0 */');
      }
      else
        return (this.create_snippet(out) + (this.editor_settings.newline_after_block ? '\n' : ''));
    }

  DocBlockrAtom.prototype.substitute_variables = function(out) {
    function get_var(match, group, str) {
      var var_name = group;
      if(var_name == 'datetime') {
          var datetime = new Date();
          return format_time(datetime);
      }
      else if(var_name == 'date') {
        var datetime = new Date();
        return datetime.toISOString().replace(/T.*/, '');
      }
      else
        return match;
    }
    function format_time(datetime) {
      function length_fix(x) {
        if(x < 10)
          x = '0' + x;
        return x;
      }
      var hour = length_fix(datetime.getHours());
      var min = length_fix(datetime.getMinutes());
      var sec = length_fix(datetime.getSeconds());
      var tz = datetime.getTimezoneOffset() / -60;
      var tz_string;
      if(tz >= 0)
        tz_string = '+';
      else 
        tz_string = '-';
      tz_string+=  length_fix(Math.floor(Math.abs(tz)).toString()) + ((tz % 1) * 60);
      datetime = datetime.toISOString().replace(/T.*/, '');
      return datetime+= 'T' + hour + ':' + min + ':' + sec + tz_string;  
    }
    function sub_line(line) {
      var regex = new RegExp('\{\{([^}]+)\}\}', 'g');
      return line.replace(regex, get_var);
    }
    return out.map(sub_line)
  }

    return DocBlockrAtom;
})();
