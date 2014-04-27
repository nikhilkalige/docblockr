var DocsParser = require('./docsparser.js');
var escape = DocsParser.escape;
//var Snippets = atom.packages.activePackages.snippets.mainModule;

var DocBlockrAtom;
module.exports =
  DocBlockrAtom = (function() {

    function DocBlockrAtom() {
      var self = this;
      var settings = atom.config.getSettings().docblockr;
      this.editor_settings = settings;
      
      atom.workspaceView.command('docblockr:parse', function(event) {
        var regex = /^\s*(\/\*|###)[*!]\s*$/;
        if(self.validate_request(regex))
          self.parse(false);
        else
          event.abortKeyBinding();
      });

      atom.workspaceView.command('docblockr:parse_inline', function(event) {
        var regex = /^\s*\/\*{2}$/;
        if(self.validate_request(regex))
          self.parse(true);
        else
          event.abortKeyBinding();
      });
    }

    DocBlockrAtom.prototype.validate_request = function(regex) {
      var editor = atom.workspace.getActiveEditor();
      var cursor_position = editor.getCursorBufferPosition();
      var preceding_text = editor.getTextInBufferRange([[cursor_position.row, 0], cursor_position]);
      if(preceding_text.search(regex) < 0) {
        return false;
      }
      return true;
    };

    DocBlockrAtom.prototype.parse = function(inline) {
      var editor = atom.workspace.getActiveEditor();
      if (typeof editor === 'undefined' || editor === null) {
        return;
      }
      this.initialize(editor, inline);
      if(this.parser.is_existing_comment(this.line)) {
        this.write(editor, '\n *' + this.indentSpaces);
        return;
      }
      
      // erase characters in the view (will be added to the output later)
      this.erase(editor, this.trailing_range);

      // match against a function declaration.
      // TODO: skip temporrarily
      var out = this.parser.parse(this.line);
      var snippet = this.generate_snippet(out, inline);
      // atom doesnt currently support, snippet end by default
      // so add $0
      if(snippet.search(/\${0:/) < 0)
        snippet+= '$0';
      this.write(editor, snippet);
    };

    DocBlockrAtom.prototype.initialize = function(editor, inline) {
      inline = (typeof inline === 'undefined') ? false : inline;
      var cursor_position = editor.getCursorBufferPosition(); // will handle only one instance
      // Get trailing string
      var line_length = editor.lineLengthForBufferRow(cursor_position.row);
      this.trailing_range = [cursor_position, [cursor_position.row, line_length]];
      this.trailing_string = editor.getTextInBufferRange(this.trailing_range);
      // drop trailing */
      this.trailing_string = this.trailing_string.replace(/\s*\*\/\s*$/, '');
      this.trailing_string = escape(this.trailing_string);

      this.parser = parser = this.get_parser(editor);
      parser.inline = inline;

      this.indentSpaces = this.repeat(' ', Math.max(0, (this.editor_settings.indentation_spaces || 1)));
      this.prefix = '*';

      settingsAlignTags = this.editor_settings.align_tags || 'deep';
      this.deepAlignTags = settingsAlignTags == 'deep';
      this.shallowAlignTags = ((settingsAlignTags == 'shallow') || (settingsAlignTags === true));

      // use trailing string as a description of the function
      if(this.trailingString)
          parser.setNameOverride(this.trailingString);

      // read the next line
      cursor_position = cursor_position.copy();
      cursor_position.row+= 1;
      this.line = parser.get_definition(editor, cursor_position, this.read_line);
    };

    DocBlockrAtom.prototype.counter = function() {
      var count = 0;
      return (function() { 
        return ++count;
      });
    };

    DocBlockrAtom.prototype.repeat = function(string, number) {
      return Array(number + 1).join(string);
    };

    DocBlockrAtom.prototype.write = function(editor, str) {
      // will insert data at last cursor position
      var Snippets = atom.packages.activePackages.snippets.mainModule;
      Snippets.insert(str, editor);
    };

    DocBlockrAtom.prototype.erase = function(editor, range) {
      var buffer = editor.getBuffer();
      buffer.delete(range);
    };

    DocBlockrAtom.prototype.fill_array = function(len) {
      var a = [];
      var i = 0;
      while (i < len) {
        a[i] = 0;
        i++;
      }
      return a;
    };

    DocBlockrAtom.prototype.read_line = function(editor, point) {
        // TODO: no longer works
        if(point >= editor.getText().length)
            return;
        return editor.lineForBufferRow(point.row);
    };

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
    };

    DocBlockrAtom.prototype.generate_snippet = function(out, inline) {
      //# substitute any variables in the tags
      if(out) 
        out = this.substitute_variables(out);

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
    };

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
      return out.map(sub_line);
    };

    DocBlockrAtom.prototype.align_tags = function(out) {
      var output_width = function(str){
        // get the length of a string, after it is output as a snippet,
        // "${1:foo}" --> 3
        return str.replace(/[$][{]\d+:([^}]+)[}]/, '$1').replace('\\$', '$').length;
      };
      // count how many columns we have
      var maxCols = 0;
      // this is a 2d list of the widths per column per line
      var widths = [];
      var return_tag;
      // Grab the return tag if required.
      if(this.editor_settings.per_section_indent)
          return_tag = this.editor_settings.return_tag || '@return';
      else
          return_tag = false;

      for(var i=0; i<out.length; i++) {
        if(out[i].startsWith('@')) {
          // Ignore the return tag if we're doing per-section indenting.
          if(return_tag && out[i].startsWith(return_tag))
              continue;
          // ignore all the words after `@author`
          var columns = (!out[i].startsWith('@author')) ? out[i].split(' ') : ['@author'];
          widths.push(columns.map(output_width));
          maxCols = Math.max(maxCols, widths[widths.length - 1].length);
        }
      }
      // initialise a list to 0
      var maxWidths = this.fill_array(maxCols);

      if(this.shallowAlignTags)
          maxCols = 1;

      for(i = 0; i < maxCols; i++) {
        for(var j = 0; j < widths.length; j++) {
          if(i < widths[j].length)
            maxWidths[i] = Math.max(maxWidths[i], widths[j][i]);
        }
      }
      // Convert to a dict so we can use .get()
      // maxWidths = dict(enumerate(maxWidths))

      // Minimum spaces between line columns
      var minColSpaces = this.editor_settings.min_spaces_between_columns || 1;
      for(i = 0; i_len = out.length, i < i_len; i++) {
        // format the spacing of columns, but ignore the author tag. (See #197)
        if((out[i].startsWith('@')) && (!out[i].startsWith('@author'))) {
          var new_out = [];
          var split_array = out[i].split(' ');
          for(var j=0; j_len = split_array.length, j < j_len; j++) {
            new_out.push(split_array[j]);
            new_out.push(this.repeat(' ', minColSpaces) + (
                                      this.repeat(' ', ((maxWidths[j] || 0) - output_width(split_array[j])))
                                    ));
          }
          out[i] = new_out.join('').trim();
        }
      }
      return out;
    };

    DocBlockrAtom.prototype.fix_tab_stops = function(out) {
      var tab_index = this.counter();
      var swap_tabs = function(match, group1, group2, str) {
        return (group1 + tab_index() + group2);
      };
      var i, len;
      for(i=0; len = out.length, i<len; i++)
        out[i] = out[i].replace(/(\$\{)\d+(:[^}]+\})/g, swap_tabs);
      return out;
    };

    DocBlockrAtom.prototype.create_snippet = function(out) {
      var snippet = '';
      var closer = this.parser.settings.commentCloser;
      var regex = new RegExp('^\s*@([a-zA-Z]+)');
      var i, len;
      if(out) {
        if(this.editor_settings.spacer_between_sections === true) {
          var last_tag = null;
          for(i=0; len = out.length, i < len; i++) {
            var match = regex.exec(out[i]);
            if(match && (last_tag != match[1])) {
              last_tag = match[1];
              out.splice(i, 0 , '');
            }
          }
        }
        else if(this.editor_settings.spacer_between_sections == 'after_description') {
          var lastLineIsTag = false;
          for(i=0; len = out.length, i < len; i++) {
            var match = regex.exec(out[i]);
            if(match) {
              if(!lastLineIsTag)
                out.splice(i, 0, '');
              lastLineIsTag = true;
            }
          }
        }
        for(i=0; len = out.length, i < len; i++) {
          snippet+= '\n ' + this.prefix + (out[i] ? (this.indentSpaces + out[i]) : '');
        }
      }
      else
        snippet+= '\n ' + this.prefix + this.indentSpaces + '${0:' + this.trailing_string + '}';

      snippet+= '\n' + closer;
      return snippet;
    };

    return DocBlockrAtom;
})();