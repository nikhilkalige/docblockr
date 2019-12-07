const DocsParser = require('../docsparser');
const xregexp = require('xregexp');

module.exports = class ActionscriptParser extends DocsParser {
  setupSettings () {
    const nameToken = '[a-zA-Z_][a-zA-Z0-9_]*';
    this.settings = {
      commentType: 'block',
      typeInfo: false,
      curlyTypes: false,
      typeTag: '',
      commentCloser: ' */',
      fnIdentifier: nameToken,
      varIdentifier: `(${nameToken})(?::${nameToken})?`,
      fnOpener: 'function(?:\\s+[gs]et)?(?:\\s+' + nameToken + ')?\\s*\\(',
      bool: 'bool',
      function: 'function'
    };
  }

  parseFunction (line) {
    let regex = xregexp(
      // fnName = function,  fnName : function
      '(?:(?P<name1>' + this.settings.varIdentifier + ')\\s*[:=]\\s*)?' +
          'function(?:\\s+(?P<getset>[gs]et))?' +
          // function fnName
          '(?:\\s+(?P<name2>' + this.settings.fnIdentifier + '))?' +
          // (arg1, arg2)
          '\\s*\\(\\s*(?P<args>.*?)\\)'
    );
    const matches = xregexp.exec(line, regex);
    if (matches === null) { return null; }

    regex = new RegExp(this.settings.varIdentifier, 'g');
    const name = matches.name1 || matches.name2 || '';
    const args = matches.args;
    const options = {};
    if (matches.getset === 'set') { options.asSetter = true; }

    return [name, args, null, options];
  }

  parseVar (line) {
    return null;
  }

  getArgName (arg) {
    if (!arg) {
      return arg;
    }
    const regex = new RegExp(this.settings.varIdentifier + '(\\s*=.*)?');
    const match = arg.match(regex);
    if (match && match[1]) {
      return match[1];
    } else {
      return arg;
    }
  }

  getArgType (arg) {
    // could actually figure it out easily, but it's not important for the documentation
    return null;
  }
};
