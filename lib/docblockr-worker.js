const Parsers = {
  JsParser: require('./languages/javascript'),
  CppParser: require('./languages/cpp'),
  RustParser: require('./languages/rust'),
  PhpParser: require('./languages/php'),
  CoffeeParser: require('./languages/coffee'),
  ActionscriptParser: require('./languages/actionscript'),
  ObjCParser: require('./languages/objc'),
  JavaParser: require('./languages/java'),
  TypescriptParser: require('./languages/typescript'),
  ProcessingParser: require('./languages/processing'),
  SassParser: require('./languages/sass')
};

const escape = require('./utils').escape;
const util = require('util');
// const Snippets = global.atom.packages.activePackages.snippets.mainModule;
class DocBlockrAtom {
  constructor () {
    const settings = global.atom.config.get('docblockr');
    this.editorSettings = settings;

    global.atom.config.observe('docblockr', () => {
      this.updateConfig();
    });

    global.atom.commands.add('atom-workspace', 'docblockr:parse-tab', event => {
      const regex = {
        // Parse Command
        parse: /^\s*(\/\*([*!])|###\*|\/\/\*|\/\/\/)\s*$/,
        // Indent Command
        indent: /^(\s*\*|\/\/\/)\s*$/
      };

      if (this.validateRequest(event, { preceding: true, precedingRegex: regex.parse })) {
        // Parse Command
        this.parseCommand(event, false);
      } else if (this.validateRequest(event, { preceding: true, precedingRegex: regex.indent })) {
        // Indent Command
        this.indentCommand(event);
      } else {
        event.abortKeyBinding();
      }
    });

    global.atom.commands.add('atom-workspace', 'docblockr:parse-enter', event => {
      const regex = {
        // Parse Command
        parse: /^\s*(\/\*([*!])|###\*|\/\/\*)\s*$/,
        // Trim auto whitespace
        trimAuto: [/^\s*\*\s*$/, /^\s*$/],
        // Deindent Command
        deindent: /^\s+\*\//,
        // Snippet-1
        snippetOne: [/^\s*\/\*$/, /^\*\/\s*$/],
        // Close block comment
        closeBlock: /^\s*\/\*\s*$/,
        // extend line
        extendLine: /^\s*(\/\/|#)/,
        // extend block
        extendBlock: /^\s*(\/\/[/!]?)/,
        // Extend docblock by adding an asterix at start
        extend: /^\s*\*(?:.?|.*(?:[^*][^/]|[^*]\/|\*[^/]))\s*$/
      };

      if (this.validateRequest(event, { preceding: true, precedingRegex: regex.parse })) {
        // Parse Command
        this.parseCommand(event, false);
      } else if (this.validateRequest(event, { preceding: true, precedingRegex: regex.trimAuto[0], following: true, followingRegex: regex.trimAuto[1], scope: 'comment.block' })) {
        // Trim auto whitespace
        this.trimAutoWhitespaceCommand(event);
      } else if (this.validateRequest(event, { preceding: true, precedingRegex: regex.deindent })) {
        // Deindent command
        this.deindentCommand(event);
      } else if (this.validateRequest(event, { preceding: true, precedingRegex: regex.snippetOne[0], following: true, followingRegex: regex.snippetOne[1] })) {
        // Snippet-1 command
        this.write(event, '\n$0\n ');
      } else if (this.validateRequest(event, { preceding: true, precedingRegex: regex.closeBlock })) {
        // Close block comment command
        this.parseBlockCommand(event);
      } else if ((this.editorSettings.extend_double_slash === true) && (this.validateRequest(event, { preceding: true, precedingRegex: regex.extendLine, scope: 'comment.line' }))) {
        // Extend line comments (// and #)
        const _regex = /^(\s*[^\sa-z0-9]*\s*).*$/;
        const editor = event.target.closest('atom-text-editor').getModel();
        const cursorPosition = editor.getCursorBufferPosition();
        let lineText = editor.lineTextForBufferRow(cursorPosition.row);
        lineText = lineText.replace(_regex, '$1');
        editor.insertText('\n' + lineText);
      } else if ((this.editorSettings.extend_triple_slash === true) && (this.validateRequest(event, { preceding: true, precedingRegex: regex.extendBlock, scope: 'comment.block' }))) {
        // Extend block comments (/// and //!)
        const _regex = /^(\s*[^\sa-z0-9]*\s*).*$/;
        const editor = event.target.closest('atom-text-editor').getModel();
        const cursorPosition = editor.getCursorBufferPosition();
        let lineText = editor.lineTextForBufferRow(cursorPosition.row);
        lineText = lineText.replace(_regex, '$1');
        editor.insertText('\n' + lineText);
      } else if (this.validateRequest(event, { preceding: true, precedingRegex: regex.extend, scope: 'comment.block' })) {
        // Extend docblock by adding an asterix at start
        const _regex = /^(\s*\*\s*).*$/;
        const editor = event.target.closest('atom-text-editor').getModel();
        const cursorPosition = editor.getCursorBufferPosition();
        let lineText = editor.lineTextForBufferRow(cursorPosition.row);
        lineText = lineText.replace(_regex, '$1');
        editor.insertText('\n' + lineText);
      } else {
        event.abortKeyBinding();
      }
    });

    global.atom.commands.add('atom-workspace', 'docblockr:parse-inline', event => {
      // console.log('Parse-Inline command');
      const _regex = /^\s*\/\*{2}$/;

      if (this.validateRequest(event, { preceding: true, precedingRegex: _regex })) { this.parseCommand(event, true); } else {
        const editor = event.target.closest('atom-text-editor').getModel();
        editor.insertNewline();
        // event.abortKeyBinding();
      }
    });

    global.atom.commands.add('atom-workspace', 'docblockr:join', event => {
      // console.log('Join command');
      if (this.validateRequest(event, { scope: 'comment.block' })) { this.joinCommand(event); }
    });

    global.atom.commands.add('atom-workspace', 'docblockr:reparse', event => {
      // console.log('Reparse command');
      if (this.validateRequest(event, { scope: 'comment.block' })) { this.reparseCommand(event); }
    });

    global.atom.commands.add('atom-workspace', 'docblockr:wrap-lines', event => {
      // console.log('Wraplines command');
      if (this.validateRequest(event, { scope: 'comment.block' })) { this.wrapLinesCommand(event); }
    });

    global.atom.commands.add('atom-workspace', 'docblockr:decorate', event => {
      // console.log('Decorate command');
      if (this.validateRequest(event, { scope: 'comment.line' })) { this.decorateCommand(event); }
    });

    global.atom.commands.add('atom-workspace', 'docblockr:decorate-multiline', event => {
      // console.log('Decorate Multiline command');
      if (this.validateRequest(event, { scope: 'comment.block' })) { this.decorateMultilineCommand(event); }
    });
  }

  updateConfig () {
    const settings = global.atom.config.get('docblockr');
    this.editorSettings = settings;
  }

  /**
     * Validate the keypress request
     * @param  {Boolean}  preceding        Check against regex if true
     * @param  {Regex}    precedingRegex  Regex to check preceding text against
     * @param  {Boolean}  following        Check against regex if true
     * @param  {Regex}    followingRegex  Regex to check following text against
     * @param  {String}   scope            Check if cursor matches scope
     */
  validateRequest (event, options) {
    /**
       *  Multiple cursor behaviour:
       *   1. Add mulitple snippets dependent on cursor pos, this makes traversing
       *        snippets not possible
       *   2. So we will iterate over the cursors and find the first among the cursors
       *        that satisfies the regex, the rest of the cursors will be deleted.
       */

    options = (typeof options !== 'undefined') ? options : {};

    const preceding = (typeof options.preceding !== 'undefined') ? options.preceding : false;
    const precedingRegex = (typeof options.precedingRegex !== 'undefined') ? options.precedingRegex : '';
    const following = (typeof options.following !== 'undefined') ? options.following : false;
    const followingRegex = (typeof options.followingRegex !== 'undefined') ? options.followingRegex : '';
    const scope = (typeof options.scope !== 'undefined') ? options.scope : false;

    const editor = event.target.closest('atom-text-editor').getModel();
    this.cursors = [];
    let i, len, followingText, precedingText;

    const cursorPositions = editor.getCursors();

    for (i = 0, len = cursorPositions.length; i < len; i++) {
      const cursorPosition = cursorPositions[i].getBufferPosition();

      if (scope) {
        const scopeList = editor.scopeDescriptorForBufferPosition(cursorPosition).getScopesArray();
        let _i, _len;
        for (_i = 0; _i < (_len = scopeList.length); _i++) {
          if (scopeList[_i].search(scope) > -1) {
            break;
          }
        }

        if (_i === _len) {
          // scope did not succeed
          continue;
        }
      }

      if (preceding) { precedingText = editor.getTextInBufferRange([[cursorPosition.row, 0], cursorPosition]); }

      if (following) {
        const lineLength = editor.lineTextForBufferRow(cursorPosition.row).length;
        const followingRange = [cursorPosition, [cursorPosition.row, lineLength]];
        followingText = editor.getTextInBufferRange(followingRange);
      }

      if (preceding && following) {
        if ((precedingText.search(precedingRegex) > -1) && (followingText.search(followingRegex) > -1)) {
          this.cursors.push(cursorPosition);
          break;
        }
      } else if (preceding) {
        if (precedingText.search(precedingRegex) > -1) {
          this.cursors.push(cursorPosition);
          break;
        }
      } else if (following) {
        if (followingText.search(followingRegex) > -1) {
          this.cursors.push(cursorPosition);
          break;
        }
      } else if (scope) {
        /* comes here only if scope is being checked */
        return true;
      }
    }

    if (this.cursors.length > 0) {
      cursorPositions.splice(i, 1);
      cursorPositions.forEach(value => value.destroy());
      return true;
    } else { return false; }
  }

  parseCommand (event, inline) {
    const editor = event.target.closest('atom-text-editor').getModel();
    if (typeof editor === 'undefined' || editor === null) {
      return;
    }
    this.initialize(editor, inline);
    if (this.parser.isExistingComment(this.line)) {
      this.write(event, '\n *' + this.indentSpaces);
      return;
    }

    // erase characters in the view (will be added to the output later)
    this.erase(editor, this.trailingRange);

    // match against a function declaration.
    const out = this.parser.parse(this.line);
    let snippet = this.generateSnippet(out, inline);
    // atom doesnt currently support, snippet end by default
    // so add $0
    if ((snippet.search(/\${0:/) < 0) && (snippet.search(/\$0/) < 0)) { snippet += '$0'; }
    this.write(event, snippet);
  }

  /**
   * Perform actions for a single-asterix block comment
   */
  parseBlockCommand (event) {
    const editor = event.target.closest('atom-text-editor').getModel();
    if (typeof editor === 'undefined' || editor === null) {
      return;
    }
    this.initialize(editor, false);

    // Remove trailing characters (will write them appropriately later)
    this.erase(editor, this.trailingRange);

    // Build the string to write
    let string = '\n';

    // Might include asterixes
    if (this.editorSettings.c_style_block_comments) {
      string += ' *' + this.indentSpaces;
    }

    // Write indentation and trailing characters. Place cursor before
    // trailing characters

    string += '$0';
    string += this.trailingString;

    // Close if needed
    if (!this.parser.isExistingComment(this.line)) {
      string += '\n */';
    }

    this.write(event, string);
  }

  trimAutoWhitespaceCommand (event) {
    /**
     * Trim the automatic whitespace added when creating a new line in a docblock.
     */
    const editor = event.target.closest('atom-text-editor').getModel();
    if (typeof editor === 'undefined' || editor === null) {
      return;
    }
    const cursorPosition = editor.getCursorBufferPosition();
    let lineText = editor.lineTextForBufferRow(cursorPosition.row);
    const lineLength = editor.lineTextForBufferRow(cursorPosition.row).length;
    const spaces = Math.max(0, this.editorSettings.indentation_spaces);

    const regex = /^(\s*\*)\s*$/;
    lineText = lineText.replace(regex, ('$1\n$1' + this.repeat(' ', spaces)));
    const range = [[cursorPosition.row, 0], [cursorPosition.row, lineLength]];
    editor.setTextInBufferRange(range, lineText);
  }

  indentCommand (event) {
    const editor = event.target.closest('atom-text-editor').getModel();
    const currentPos = editor.getCursorBufferPosition();
    const prevLine = editor.lineTextForBufferRow(currentPos.row - 1);
    const spaces = this.getIndentSpaces(editor, prevLine);

    if (spaces !== null) {
      const matches = /^(\s*(?:\*|\/\/\/))/.exec(prevLine);
      const toStar = matches[1].length;
      const toInsert = spaces - currentPos.column + toStar;
      if (toInsert > 0) {
        editor.insertText(this.repeat(' ', toInsert));
      }
      return;
    }
    event.abortKeyBinding();
  }

  joinCommand (event) {
    const editor = event.target.closest('atom-text-editor').getModel();
    const selections = editor.getSelections();
    let i, j, rowBegin;
    const textWithEnding = row => editor.buffer.lineForRow(row) + editor.buffer.lineEndingForRow(row);

    for (i = 0; i < selections.length; i++) {
      const selection = selections[i];
      let noRows;
      const _r = selection.getBufferRowRange();
      noRows = Math.abs(_r[0] - _r[1]); // no of rows in selection
      rowBegin = Math.min(_r[0], _r[1]);
      if (noRows === 0) {
        // exit if current line is the last one
        if ((_r[0] + 1) === editor.getLastBufferRow()) { continue; }
        noRows = 2;
      } else { noRows += 1; }

      let text = '';
      for (j = 0; j < noRows; j++) {
        text += textWithEnding(rowBegin + j);
      }
      const regex = /[ \t]*\n[ \t]*((?:\*|\/\/[!/]?|#)[ \t]*)?/g;
      text = text.replace(regex, ' ');
      const endLineLength = editor.lineTextForBufferRow(rowBegin + noRows - 1).length;
      const range = [[rowBegin, 0], [rowBegin + noRows - 1, endLineLength]];
      editor.setTextInBufferRange(range, text);
    }
  }

  decorateCommand (event) {
    const editor = event.target.closest('atom-text-editor').getModel();
    const pos = editor.getCursorBufferPosition();
    const whitespaceRe = /^(\s*)\/\//;
    const scopeRange = this.scopeRange(editor, pos, 'comment.line.double-slash');

    let maxLen = 0;
    let _i, leadingWs, lineText, tabCount;
    const _row = scopeRange[0].row;
    const _len = Math.abs(scopeRange[0].row - scopeRange[1].row);

    for (_i = 0; _i <= _len; _i++) {
      lineText = editor.lineTextForBufferRow(_row + _i);
      tabCount = lineText.split('\t').length - 1;

      const matches = whitespaceRe.exec(lineText);
      if (matches[1] == null) { leadingWs = 0; } else { leadingWs = matches[1].length; }

      leadingWs -= tabCount;
      maxLen = Math.max(maxLen, editor.lineTextForBufferRow(_row + _i).length);
    }

    const lineLength = maxLen - leadingWs;
    leadingWs = this.repeat('\t', tabCount) + this.repeat(' ', leadingWs);
    editor.buffer.insert(scopeRange[1], '\n' + leadingWs + this.repeat('/', (lineLength + 3)) + '\n');

    for (_i = _len; _i >= 0; _i--) {
      lineText = editor.lineTextForBufferRow(_row + _i);
      const _length = editor.lineTextForBufferRow(_row + _i).length;
      const rPadding = 1 + (maxLen - _length);
      const _range = [[scopeRange[0].row + _i, 0], [scopeRange[0].row + _i, _length]];
      editor.setTextInBufferRange(_range, leadingWs + lineText + this.repeat(' ', rPadding) + '//');
    }
    editor.buffer.insert(scopeRange[0], this.repeat('/', lineLength + 3) + '\n');
  }

  decorateMultilineCommand (event) {
    const editor = event.target.closest('atom-text-editor').getModel();
    const pos = editor.getCursorBufferPosition();
    const whitespaceRe = /^(\s*)\/\*/;
    const tabSize = global.atom.config.get('editor.tabLength');
    const scopeRange = this.scopeRange(editor, pos, 'comment.block');
    const lineLengths = {};

    let maxLen = 0;
    let _i, blockWs, lineText, contentTabCount;
    const _row = scopeRange[0].row;
    const _len = Math.abs(scopeRange[0].row - scopeRange[1].row);

    // get block indent from first line
    lineText = editor.lineTextForBufferRow(_row);
    const blockTabCount = lineText.split('\t').length - 1;
    const matches = whitespaceRe.exec(lineText);
    if (matches == null) { blockWs = 0; } else { blockWs = matches[1].length; }
    blockWs -= blockTabCount;

    // get maxLen
    for (_i = 1; _i < _len; _i++) {
      lineText = editor.lineTextForBufferRow(_row + _i);
      const textLength = lineText.length;
      contentTabCount = lineText.split('\t').length - 1;
      lineLengths[_i] = textLength - contentTabCount + (contentTabCount * tabSize);
      maxLen = Math.max(maxLen, lineLengths[_i]);
    }

    const lineLength = maxLen - blockWs;
    blockWs = this.repeat('\t', blockTabCount) + this.repeat(' ', blockWs);

    // last line
    lineText = editor.lineTextForBufferRow(scopeRange[1].row);
    lineText = lineText.replace(/^(\s*)(\*)+\//, (match, p1, stars) =>
      (p1 + this.repeat('*', (lineLength + 2 - stars.length)) + '/' + '\n'));
    let _range = [[scopeRange[1].row, 0], [scopeRange[1].row, lineLength]];
    editor.setTextInBufferRange(_range, lineText);

    // first line
    lineText = editor.lineTextForBufferRow(scopeRange[0].row);
    lineText = lineText.replace(/^(\s*)\/(\*)+/, (match, p1, stars) =>
      (p1 + '/' + this.repeat('*', (lineLength + 2 - stars.length))));
    _range = [[scopeRange[0].row, 0], [scopeRange[0].row, lineLength]];
    editor.setTextInBufferRange(_range, lineText);

    // skip first line and last line
    for (_i = _len - 1; _i > 0; _i--) {
      lineText = editor.lineTextForBufferRow(_row + _i);
      const _length = editor.lineTextForBufferRow(_row + _i).length;
      const rPadding = 1 + (maxLen - lineLengths[_i]);
      _range = [[scopeRange[0].row + _i, 0], [scopeRange[0].row + _i, _length]];
      editor.setTextInBufferRange(_range, lineText + this.repeat(' ', rPadding) + '*');
    }
  }

  deindentCommand (event) {
    /*
       * When pressing enter at the end of a docblock, this takes the cursor back one space.
      /**
       *
       *//* |   <-- from here
      |      <-- to here
       */
    const editor = event.target.closest('atom-text-editor').getModel();
    const cursor = editor.getCursorBufferPosition();
    let text = editor.lineTextForBufferRow(cursor.row);
    text = text.replace(/^(\s*)\s\*\/.*/, '\n$1');
    editor.insertText(text, { autoIndentNewline: false });
  }

  reparseCommand (event) {
    // Reparse a docblock to make the fields 'active' again, so that pressing tab will jump to the next one
    const tabIndex = this.counter();
    const editor = event.target.closest('atom-text-editor').getModel();
    const pos = editor.getCursorBufferPosition();
    // const Snippets = global.atom.packages.activePackages.snippets.mainModule;
    // disable all snippet expansions

    if (editor.snippetExpansion != null) { editor.snippetExpansion.destroy(); }
    const scopeRange = this.scopeRange(editor, pos, 'comment.block');
    let text = editor.getTextInBufferRange([scopeRange[0], scopeRange[1]]);
    // escape string, so variables starting with $ won't be removed
    text = escape(text);
    // strip out leading spaces, since inserting a snippet keeps the indentation
    text = text.replace(/\n\s+\*/g, '\n *');
    // replace [bracketed] [text] with a tabstop
    text = text.replace(/(\[.+?\])/g, (m, g1) => `\${${tabIndex()}:${g1}}`);

    editor.buffer.delete(([scopeRange[0], scopeRange[1]]));
    editor.setCursorBufferPosition(scopeRange[0]);
    if ((text.search(/\${0:/) < 0) && (text.search(/\$0/) < 0)) { text += '$0'; }
    this.write(event, text);
  }

  wrapLinesCommand (event) {
    /**
     * Reformat description text inside a comment block to wrap at the correct length.
     * Wrap column is set by the first ruler (set in Default.sublime-settings), or 80 by default.
     * Shortcut Key: alt+q
     */
    const editor = event.target.closest('atom-text-editor').getModel();
    const pos = editor.getCursorBufferPosition();
    // const tabSize = global.atom.config.get('editor.tabLength');
    const wrapLen = global.atom.config.get('editor.preferredLineLength');

    const numIndentSpaces = Math.max(0, (this.editorSettings.indentation_spaces ? this.editorSettings.indentation_spaces : 1));
    const indentSpaces = this.repeat(' ', numIndentSpaces);
    const indentSpacesSamePara = this.repeat(' ', (this.editorSettings.indentation_spaces_same_para ? this.editorSettings.indentation_spaces_same_para : numIndentSpaces));
    const spacerBetweenSections = (this.editorSettings.spacer_between_sections === 'true');
    const spacerBetweenDescTags = (this.editorSettings.spacer_between_sections !== 'false');

    const scopeRange = this.scopeRange(editor, pos, 'comment.block');
    // const text = editor.getTextInBufferRange([scopeRange[0], scopeRange[1]]);

    // find the first word
    let i, len, _col, _text;
    const startPoint = {};
    const endPoint = {};
    const startRow = scopeRange[0].row;
    len = Math.abs(scopeRange[0].row - scopeRange[1].row);
    for (i = 0; i <= len; i++) {
      _text = editor.lineTextForBufferRow(startRow + i);
      _col = _text.search(/^\s*\* /);
      if (_col > -1) {
        if (i === 0) {
          startPoint.column = scopeRange[0].column + _col;
        } else {
          startPoint.column = _col;
        }
        startPoint.row = scopeRange[0].row + i;
        break;
      }
    }
    // find the first tag, or the end of the comment
    for (i = 0; i <= len; i++) {
      _text = editor.lineTextForBufferRow(startRow + i);
      _col = _text.search(/^\s*\*(\/)/);
      if (_col > -1) {
        if (i === 0) {
          endPoint.column = scopeRange[0].column + _col;
        } else {
          endPoint.column = _col;
        }
        endPoint.row = scopeRange[0].row + i;
        break;
      }
    }
    let text = editor.getTextInBufferRange([startPoint, endPoint]);

    // find the indentation level
    const regex = /(\s*\*)/;
    const matches = regex.exec(text);
    // const indentation = matches[1].replace(/\t/g, this.repeat(' ', tabSize)).length;
    const linePrefix = matches[1];

    // join all the lines, collapsing "empty" lines
    text = text.replace(/\n(\s*\*\s*\n)+/g, '\n\n');

    const wrapPara = para => {
      para = para.replace(/(\n|^)\s*\*\s*/g, ' ');
      let _i;
      // split the paragraph into words
      const words = para.trim().split(' ');
      let text = '\n';
      let line = linePrefix + indentSpaces;
      let lineTagged = false; // indicates if the line contains a doc tag
      let paraTagged = false; // indicates if this paragraph contains a doc tag
      let lineIsNew = true;
      let tag = '';
      // join all words to create lines, no longer than wrapLength
      for (_i = 0; _i < words.length; _i++) {
        const word = words[_i];
        if ((word == null) && (!lineTagged)) { continue; }

        if ((lineIsNew) && (word[0] === '@')) {
          lineTagged = true;
          paraTagged = true;
          tag = word;
        }

        if ((line.length + word.length) > wrapLen) {
          // appending the word to the current line would exceed its
          // length requirements
          text += line.replace(/\s+$/, '') + '\n';
          line = linePrefix + indentSpacesSamePara + word + ' ';
          lineTagged = false;
          lineIsNew = true;
        } else {
          line += word + ' ';
        }
        lineIsNew = false;
      }
      text += line.replace(/\s+$/, '');

      return {
        text: text,
        lineTagged: lineTagged,
        tagged: paraTagged,
        tag: tag
      };
    };

    // split the text into paragraphs, where each paragraph is eighter
    // defined by an empty line or the start of a doc parameter
    const paragraphs = text.split(/\n{2,}|\n\s*\*\s*(?=@)/);
    const wrappedParas = [];
    text = '';
    for (i = 0; i < paragraphs.length; i++) {
      // wrap the lines in the current paragraph
      wrappedParas.push(wrapPara(paragraphs[i]));
    }

    // combine all the paragraphs into a single piece of text
    for (i = 0; i < (len = wrappedParas.length); i++) {
      const para = wrappedParas[i];
      const last = (i === (wrappedParas.length - 1));
      let _tag, _tagged;
      if (i === len - 1) {
        _tag = _tagged = false;
      } else {
        _tag = wrappedParas[i + 1].tag;
        _tagged = wrappedParas[i + 1].tagged;
      }
      const nextIsTagged = (!last && _tagged);
      const nextIsSameTag = ((nextIsTagged && para.tag) === _tag);

      if (last || ((para.lineTagged || nextIsTagged) && !(spacerBetweenSections && (!nextIsSameTag)) && !((!para.lineTagged) && nextIsTagged && spacerBetweenDescTags))) {
        text += para.text;
      } else {
        text += para.text + '\n' + linePrefix;
      }
    }
    text = escape(text);
    // strip start \n
    if (text.search(/^\n/) > -1) { text = text.replace(/^\n/, ''); }
    // add end \n
    if (text.search(/\n$/) < 0) { text += '\n'; }
    editor.setTextInBufferRange([startPoint, endPoint], text);
  }

  getIndentSpaces (editor, line) {
    const hasTypes = this.getParser(editor).settings.typeInfo;
    const extraIndent = ((hasTypes === true) ? '\\s+\\S+' : '');

    const regex = [
      new RegExp(util.format('^\\s*(\\*|\\/\\/\\/)(\\s*@(?:param|property)%s\\s+\\S+\\s+)\\S', extraIndent)),
      new RegExp(util.format('^\\s*(\\*|\\/\\/\\/)(\\s*@(?:returns?|define)%s\\s+\\S+\\s+)\\S', extraIndent)),
      new RegExp('^\\s*(\\*|\\/\\/\\/)(\\s*@[a-z]+\\s+)\\S'),
      new RegExp('^\\s*(\\*|\\/\\/\\/)(\\s*)')
    ];

    let i, matches;
    for (i = 0; i < regex.length; i++) {
      matches = regex[i].exec(line);
      if (matches != null) { return matches[1].length; }
    }
    return null;
  }

  initialize (editor, inline) {
    inline = (typeof inline === 'undefined') ? false : inline;
    let cursorPosition = editor.getCursorBufferPosition(); // will handle only one instance
    // Get trailing string
    const lineLength = editor.lineTextForBufferRow(cursorPosition.row).length;
    this.trailingRange = [cursorPosition, [cursorPosition.row, lineLength]];
    this.trailingString = editor.getTextInBufferRange(this.trailingRange);
    // drop trailing */
    this.trailingString = this.trailingString.replace(/\s*\*\/\s*$/, '');
    this.trailingString = escape(this.trailingString);

    this.parser = this.getParser(editor);
    this.parser.inline = inline;

    this.indentSpaces = this.repeat(' ', Math.max(0, (this.editorSettings.indentation_spaces || 1)));
    this.prefix = this.getParser(editor).settings.prefix || ' *';

    const settingsAlignTags = this.editorSettings.align_tags || 'deep';
    this.deepAlignTags = settingsAlignTags === 'deep';
    this.shallowAlignTags = ((settingsAlignTags === 'shallow') || (settingsAlignTags === true));

    // use trailing string as a description of the function
    if (this.trailingString) { this.parser.setNameOverride(this.trailingString); }

    // read the next line
    cursorPosition = cursorPosition.copy();
    cursorPosition.row += 1;
    this.line = this.parser.getDefinition(editor, cursorPosition, this.readLine);
  }

  setSnippetsService (service) {
    this.snippetsService = service;
  }

  counter () {
    let count = 0;
    return () => ++count;
  }

  repeat (string, number) {
    return Array(Math.max(0, number) + 1).join(string);
  }

  write (event, str) {
    const editor = event.target.closest('atom-text-editor').getModel();
    // will insert data at last cursor position
    if (this.snippetsService) { this.snippetsService.insertSnippet(str, editor); } else {
      global.atom.notifications.addFatalError('Docblockr: Snippets package disabled.', {
        detail: 'Please enable Snippets package for Docblockr to function properly.',
        dismissable: true,
        icon: 'flame'
      });
      event.abortKeyBinding();
    }
  }

  erase (editor, range) {
    const buffer = editor.getBuffer();
    buffer.delete(range);
  }

  fillArray (len) {
    const a = [];
    let i = 0;
    while (i < len) {
      a[i] = 0;
      i++;
    }
    return a;
  }

  readLine (editor, point) {
    // TODO: no longer works
    if (point >= editor.getText().length) { return; }
    return editor.lineTextForBufferRow(point.row);
  }

  scopeRange (editor, point, scopeName) {
    // find scope starting point
    // checks: ends when row less than zero, column != 0
    // check if current point is valid
    let _range;
    if ((_range = editor.bufferRangeForScopeAtPosition(scopeName, point)) == null) { return null; }

    let start, end;
    let _row = point.row;
    let lineLength;
    start = _range.start;
    end = _range.end;
    while (_row >= 0) {
      lineLength = editor.lineTextForBufferRow(_row).length;
      _range = editor.bufferRangeForScopeAtPosition(scopeName, [_row, lineLength]);
      if (_range == null) { break; }
      start = _range.start;
      if (start.column > 0) {
        break;
      }
      _row--;
    }
    _row = point.row;
    const lastRow = editor.getLastBufferRow();
    while (_row <= lastRow) {
      lineLength = editor.lineTextForBufferRow(_row).length;
      _range = editor.bufferRangeForScopeAtPosition(scopeName, [_row, 0]);
      if (_range == null) { break; }
      end = _range.end;
      if (end.column < lineLength) {
        break;
      }
      _row++;
    }
    return [start, end];
  }

  getParser (editor) {
    const scope = editor.getGrammar().scopeName;
    const regex = /\bsource\.([a-z+-]+)(?:\.([a-z+-]+))?/;
    const matches = regex.exec(scope);
    const sourceLang = (matches === null) ? null : matches[1];
    const subSourceLang = (matches === null || matches[2] === null) ? null : matches[2];

    const settings = global.atom.config.get('docblockr');

    if ((sourceLang === null) && (scope === 'text.html.php')) {
      return new Parsers.PhpParser(settings);
    }

    if (sourceLang === 'coffee') {
      return new Parsers.CoffeeParser(settings);
    } else if ((sourceLang === 'actionscript') || (sourceLang === 'haxe')) {
      return new Parsers.ActionscriptParser(settings);
    } else if ((sourceLang === 'c++') || (sourceLang === 'cpp') || (sourceLang === 'c') || (sourceLang === 'cuda-c++')) {
      return new Parsers.CppParser(settings);
    } else if ((sourceLang === 'objc') || (sourceLang === 'objc++')) {
      return new Parsers.ObjCParser(settings);
    } else if ((sourceLang === 'java') || (sourceLang === 'groovy')) {
      return new Parsers.JavaParser(settings);
    } else if (sourceLang === 'rust') {
      return new Parsers.RustParser(settings);
    } else if (sourceLang === 'ts') {
      return new Parsers.TypescriptParser(settings);
    } else if (sourceLang === 'processing') {
      return new Parsers.ProcessingParser(settings);
    } else if (sourceLang === 'css' && subSourceLang === 'scss') {
      return new Parsers.SassParser(settings);
    }
    return new Parsers.JsParser(settings);
  }

  generateSnippet (out, inline) {
    // # substitute any variables in the tags

    if (out) { out = this.substituteVariables(out); }

    // align the tags
    if (out && (this.shallowAlignTags || this.deepAlignTags) && (!inline)) { out = this.alignTags(out); }

    // fix all the tab stops so they're consecutive
    if (out) { out = this.fixTabStops(out); }

    if (inline) {
      if (out) { return (' ' + out[0] + ' */'); } else { return (' $0 */'); }
    } else { return (this.createSnippet(out) + (this.editorSettings.newline_after_block ? '\n' : '')); }
  }

  substituteVariables (out) {
    const getConst = (match, group, str) => {
      const varName = group;
      if (varName === 'datetime') {
        const datetime = new Date();
        return formatTime(datetime);
      } else if (varName === 'date') {
        const datetime = new Date();
        return datetime.toISOString().replace(/T.*/, '');
      } else { return match; }
    };
    const formatTime = datetime => {
      const lengthFix = x => `${x < 10 && '0'}${x}`;
      const hour = lengthFix(datetime.getHours());
      const min = lengthFix(datetime.getMinutes());
      const sec = lengthFix(datetime.getSeconds());
      const tz = datetime.getTimezoneOffset() / -60;
      let tzString;
      if (tz >= 0) { tzString = '+'; } else { tzString = '-'; }
      tzString += lengthFix(Math.floor(Math.abs(tz)).toString()) + ((tz % 1) * 60);
      datetime = datetime.toISOString().replace(/T.*/, '');
      return (datetime += 'T' + hour + ':' + min + ':' + sec + tzString);
    };

    return out.map(line => line.replace(/\{\{([^}]+)\}\}/g, getConst));
  }

  alignTags (out) {
    // get the length of a string, after it is output as a snippet,
    // "${1:foo}" --> 3
    const outputWidth = str => str.replace(/[$][{]\d+:([^}]+)[}]/, '$1').replace('\\$', '$').length;
    // count how many columns we have
    let maxCols = 0;
    // this is a 2d list of the widths per column per line
    const widths = [];
    let returnTag;
    // Grab the return tag if required.
    if (this.editorSettings.per_section_indent) { returnTag = this.editorSettings.return_tag || '@return'; } else { returnTag = false; }

    for (let i = 0; i < out.length; i++) {
      if (out[i].startsWith('@')) {
        // Ignore the return tag if we're doing per-section indenting.
        if (returnTag && out[i].startsWith(returnTag)) { continue; }
        // ignore all the words after `@author`
        const columns = (!out[i].startsWith('@author')) ? out[i].split(' ') : ['@author'];
        widths.push(columns.map(outputWidth));
        maxCols = Math.max(maxCols, widths[widths.length - 1].length);
      }
    }
    // initialise a list to 0
    const maxWidths = this.fillArray(maxCols);

    if (this.shallowAlignTags) { maxCols = 1; }

    for (let i = 0; i < maxCols; i++) {
      for (let j = 0; j < widths.length; j++) {
        if (i < widths[j].length) { maxWidths[i] = Math.max(maxWidths[i], widths[j][i]); }
      }
    }
    // Convert to a dict so we can use .get()
    // maxWidths = dict(enumerate(maxWidths))

    // Minimum spaces between line columns
    const minColSpaces = this.editorSettings.min_spaces_between_columns || 1;
    for (let i = 0; i < out.length; i++) {
      // format the spacing of columns, but ignore the author tag. (See #197)
      if ((out[i].startsWith('@')) && (!out[i].startsWith('@author'))) {
        const newOut = [];
        const splitArray = out[i].split(' ');
        for (let j = 0; j < splitArray.length; j++) {
          newOut.push(splitArray[j]);
          newOut.push(this.repeat(' ', minColSpaces) + (
            this.repeat(' ', ((maxWidths[j] || 0) - outputWidth(splitArray[j])))
          ));
        }
        out[i] = newOut.join('').trim();
      }
    }
    return out;
  }

  fixTabStops (out) {
    const tabIndex = this.counter();
    const swapTabs = (match, group1, group2, str) => (group1 + tabIndex() + group2);
    for (let i = 0; i < out.length; i++) { out[i] = out[i].replace(/(\$\{)\d+(:[^}]+\})/g, swapTabs); }
    return out;
  }

  createSnippet (out) {
    let snippet = '';
    const regex = /^\s*@([a-zA-Z]+)/;
    if (out) {
      if (this.editorSettings.spacer_between_sections === 'true') {
        let lastTag = null;
        for (let i = 0; i < out.length; i++) {
          const match = regex.exec(out[i]);
          if (match && (lastTag !== match[1])) {
            lastTag = match[1];
            out.splice(i, 0, '');
          }
        }
      } else if (this.editorSettings.spacer_between_sections !== 'false') {
        let lastLineIsTag = false;
        for (let i = 0; i < out.length; i++) {
          const match = regex.exec(out[i]);
          if (match) {
            if (!lastLineIsTag) { out.splice(i, 0, ''); }
            lastLineIsTag = true;
          }
        }
      }
      for (let i = 0; i < out.length; i++) {
        snippet += '\n' + this.prefix + (out[i] ? (this.indentSpaces + out[i]) : '');
      }
    } else { snippet += '\n' + this.prefix + this.indentSpaces + '${0:' + this.trailingString + '}'; }

    if (this.parser.settings.commentType === 'block') {
      snippet += '\n' + this.parser.settings.commentCloser;
    }

    return snippet;
  }
}

module.exports = DocBlockrAtom;
