const DocsParser = require('../docsparser');
const xregexp = require('xregexp');

module.exports = class RustParser extends DocsParser {
  setupSettings () {
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

  parseFunction (line) {
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

  parseVar (line) {
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

  formatFunction (name, args) {
    return [name];
  }

  formatVar (name, val, valType) {
    return [name];
  }
};
