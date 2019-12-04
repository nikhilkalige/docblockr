const DocsParser = require('../docsparser');
const xregexp = require('xregexp');

function PhpParser (settings) {
  DocsParser.call(this, settings);
}

PhpParser.prototype = Object.create(DocsParser.prototype);

PhpParser.prototype.setup_settings = function () {
  const shortPrimitives = this.editor_settings.short_primitives || false;
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
};

PhpParser.prototype.parse_class = function (line) {
  const regex = xregexp(
    '^\\s*class\\s+' +
        '(?P<name>' + this.settings.classIdentifier + ')'
  );

  const matches = xregexp.exec(line, regex);
  if (matches === null) { return null; }

  return [matches.name];
};

PhpParser.prototype.parse_function = function (line) {
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
};

PhpParser.prototype.get_arg_type = function (arg) {
  // function add($x, $y = 1)
  const regex = xregexp(
    '(?P<name>' + this.settings.varIdentifier + ')\\s*=\\s*(?P<val>.*)'
  );

  let matches = xregexp.exec(arg, regex);
  if (matches !== null) { return this.guess_type_from_value(matches.val); }

  // function sum(Array $x)
  if (arg.search(/\S\s/) > -1) {
    matches = /^(\S+)/.exec(arg);
    return matches[1];
  } else { return null; }
};

PhpParser.prototype.get_arg_name = function (arg) {
  const regex = new RegExp(
    '(' + this.settings.varIdentifier + ')(?:\\s*=.*)?$'
  );
  const matches = regex.exec(arg);
  return matches[1];
};

PhpParser.prototype.parse_var = function (line) {
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
};

PhpParser.prototype.guess_type_from_value = function (val) {
  const shortPrimitives = this.editor_settings.short_primitives || false;
  if (this.is_numeric(val)) {
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
};

PhpParser.prototype.get_function_return_type = function (name, retval) {
  const shortPrimitives = this.editor_settings.short_primitives || false;
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
  return DocsParser.prototype.get_function_return_type.call(this, name, retval);
};

PhpParser.prototype.get_definition = function (editor, pos, readLine) {
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
};

module.exports = PhpParser;
