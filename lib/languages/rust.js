const DocsParser = require('../docsparser');
const xregexp = require('xregexp');

function RustParser (settings) {
  DocsParser.call(this, settings);
}

RustParser.prototype = Object.create(DocsParser.prototype);

RustParser.prototype.setup_settings = function () {
  this.settings = {
    commentType: 'block',
    curlyTypes: false,
    typeInfo: false,
    typeTag: false,
    varIdentifier: '[a-zA-Z_][a-zA-Z_0-9]*',
    fnIdentifier: '[a-zA-Z_][a-zA-Z_0-9]*',
    fnOpener: '^\\s*fn',
    commentCloser: ' */',
    bool: 'bool',
    function: 'fn'
  };
};

RustParser.prototype.parse_function = function (line) {
  // TODO: add regexp for closures syntax
  // TODO: parse params
  const regex = xregexp('\\s*fn\\s+(?P<name>' + this.settings.fnIdentifier + ')');

  const matches = xregexp.exec(line, regex);
  if (matches === null || matches.name === undefined) {
    return null;
  }
  const name = matches.name;
  return [name, null];
};

RustParser.prototype.parse_var = function (line) {
  // TODO: add support for struct and tuple destructuring
  // TODO: parse type and value
  const regex = xregexp('\\s*let\\s+(mut\\s+)?(?P<name>' + this.settings.varIdentifier + ')');

  const matches = xregexp.exec(line, regex);
  if (matches === null || matches.name === undefined) {
    return null;
  }

  const name = matches.name;
  return [name, null, null];
};

RustParser.prototype.format_function = function (name, args) {
  return [name];
};

RustParser.prototype.format_var = function (name, val, valType) {
  return [name];
};

module.exports = RustParser;
