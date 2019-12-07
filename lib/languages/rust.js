const DocsParser = require('../docsparser');
const xregexp = require('xregexp');

module.exports = class RustParser extends DocsParser {
  setup_settings () {
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
  }

  parse_function (line) {
    // TODO: add regexp for closures syntax
    // TODO: parse params
    const regex = xregexp('\\s*fn\\s+(?P<name>' + this.settings.fnIdentifier + ')');

    const matches = xregexp.exec(line, regex);
    if (matches === null || matches.name === undefined) {
      return null;
    }
    const name = matches.name;
    return [name, null];
  }

  parse_var (line) {
    // TODO: add support for struct and tuple destructuring
    // TODO: parse type and value
    const regex = xregexp('\\s*let\\s+(mut\\s+)?(?P<name>' + this.settings.varIdentifier + ')');

    const matches = xregexp.exec(line, regex);
    if (matches === null || matches.name === undefined) {
      return null;
    }

    const name = matches.name;
    return [name, null, null];
  }

  format_function (name, args) {
    return [name];
  }

  format_var (name, val, valType) {
    return [name];
  }
};
