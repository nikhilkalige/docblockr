const DocsParser = require('../docsparser');
const xregexp = require('xregexp');

module.exports = class PhpParser extends DocsParser {
  setupSettings () {
    const shortPrimitives = this.editorSettings.short_primitives || false;
    const nameToken = '[a-zA-Z_$\\x7f-\\xff][a-zA-Z0-9_$\\x7f-\\xff]*';
    this.settings = {
      commentType: 'block',
      // curly brackets around the type information
      curlyTypes: false,
      typeInfo: true,
      typeTag: 'var',
      varIdentifier: nameToken + '(?:->' + nameToken + ')*',
      fnIdentifier: nameToken,
      classIdentifier: nameToken,
      fnOpener: 'function(?:\\s+' + nameToken + ')?\\s*\\(',
      commentCloser: ' */',
      bool: (shortPrimitives ? 'bool' : 'boolean'),
      function: 'function'
    };
  }

  parseClass (line) {
    const regex = xregexp(
      '^\\s*class\\s+' +
          '(?P<name>' + this.settings.classIdentifier + ')'
    );

    const matches = xregexp.exec(line, regex);
    if (matches === null) { return null; }

    return [matches.name];
  }

  parseFunction (line) {
    const r = '^\\s*(?:(?P<modifier>(?:(?:final\\s+)?(?:public|protected|private)\\s+)?(?:final\\s+)?(?:static\\s+)?))?' +
              'function\\s+&?(?:\\s+)?' +
              '(?P<name>' + this.settings.fnIdentifier + ')' +
              // function fnName
              // (arg1, arg2)
              '\\s*\\(\\s*(?P<args>.*?)\\)' +
              '(?:\\s*\\:\\s*(?P<retval>[a-zA-Z0-9_\\x5c]*))?';
    const regex = xregexp(r);

    const matches = xregexp.exec(line, regex);
    if (matches === null) { return null; }

    return [matches.name, (matches.args ? matches.args.trim() : null), (matches.retval ? matches.retval.trim() : null)];
  }

  getArgType (arg) {
    // function add($x, $y = 1)
    const regex = xregexp(
      '(?P<name>' + this.settings.varIdentifier + ')\\s*=\\s*(?P<val>.*)'
    );

    let matches = xregexp.exec(arg, regex);
    if (matches !== null) { return this.guessTypeFromValue(matches.val); }

    // function sum(Array $x)
    if (arg.search(/\S\s/) > -1) {
      matches = /^(\S+)/.exec(arg);
      return matches[1];
    } else { return null; }
  }

  getArgName (arg) {
    const regex = new RegExp(
      '(' + this.settings.varIdentifier + ')(?:\\s*=.*)?$'
    );
    const matches = regex.exec(arg);
    return matches[1];
  }

  parseVar (line) {
    /*
          var $foo = blah,
              $foo = blah;
          $baz->foo = blah;
          $baz = array(
               'foo' => blah
          )
      */
    const r = '^\\s*(?:(?P<modifier>var|static|const|(?:final)(?:public|private|protected)(?:\\s+final)(?:\\s+static)?)\\s+)?' +
              '(?P<name>' + this.settings.varIdentifier + ')' +
              '(?:\\s*=>?\\s*(?P<val>.*?)(?:[;,]|$))?';
    const regex = xregexp(r);
    const matches = xregexp.exec(line, regex);
    if (matches !== null) { return [matches.name, (matches.val ? matches.val.trim() : null)]; }

    return null;
  }

  guessTypeFromValue (val) {
    const shortPrimitives = this.editorSettings.short_primitives || false;
    if (this.isNumeric(val)) {
      if (val.indexOf('.') > -1) { return 'float'; }

      return (shortPrimitives ? 'int' : 'integer');
    }
    if ((val[0] === '"') || (val[0] === '\'')) { return 'string'; }
    if (val.slice(0, 5) === 'array' || val[0] === '[') { return 'array'; }

    const values = ['true', 'false', 'filenotfound'];
    if (values.indexOf(val.toLowerCase()) !== -1) {
      return (shortPrimitives ? 'bool' : 'boolean');
    }

    if (val.slice(0, 4) === 'new ') {
      const regex = new RegExp(
        'new (' + this.settings.fnIdentifier + ')'
      );
      const matches = regex.exec(val);
      return (matches[0] && matches[1]) || null;
    }
    return null;
  }

  getFunctionReturnType (name, retval) {
    const shortPrimitives = this.editorSettings.short_primitives || false;
    if (name.slice(0, 2) === '__') {
      const values = ['__construct', '__destruct', '__set', '__unset', '__wakeup'];
      for (let i = 0; i < values.length; i++) {
        if (name === values[i]) { return null; }
      }
      if (name === '__sleep') { return 'array'; }
      if (name === '__toString') { return 'string'; }
      if (name === '__isset') { return (shortPrimitives ? 'bool' : 'boolean'); }
    } else if (retval === 'void') {
      return null;
    } else if (retval) {
      return retval;
    }
    return super.getFunctionReturnType(name, retval);
  }

  getDefinition (editor, pos, readLine) {
    const maxLines = 25;

    let definition = '';

    let /* removedStrings, match, */ line;
    for (let i = 0; i < maxLines; i++) {
      line = readLine(editor, pos);
      pos.row += 1;

      // null, undefined or invaild
      if (typeof line !== 'string') {
        break;
      }

      line = line
      // strip one line comments
        .replace(/\/\/.*$/g, '')
      // strip block comments
        .replace(/\/\*.*?\*\//g, '');
      // // strip strings
      // .replace(/'(?:\\.|[^'])*'/g, '\'\'')
      // .replace(/"(?:\\.|[^"])*"/g, '""')
      // // strip leading whitespace
      // .replace(/^\s+/, '');

      definition += line;
    }

    return definition;
  }
};
