const DocsParser = require('../docsparser');
const xregexp = require('xregexp');

module.exports = class CoffeeParser extends DocsParser {
  setupSettings () {
    const identifier = '[a-zA-Z_$][a-zA-Z_$0-9]*';
    this.settings = {
      commentType: 'block',
      // curly brackets around the type information
      curlyTypes: true,
      typeTag: this.editorSettings.override_js_var || 'type',
      typeInfo: true,
      // technically, they can contain all sorts of unicode, but w/e
      varIdentifier: identifier,
      fnIdentifier: identifier,
      fnOpener: null, // no multi-line function definitions for you, hipsters!
      commentCloser: '###',
      bool: 'Boolean',
      function: 'Function'
    };
  }

  parseFunction (line) {
    const regex = xregexp(
      // fnName = function,  fnName : function
      '(?:(?P<name>' + this.settings.varIdentifier + ')\\s*[:=]\\s*)?' +
          '(?:\\((?P<args>[^()]*?)\\))?\\s*([=-]>)'
    );
    const matches = xregexp.exec(line, regex);
    if (matches === null) { return null; }

    // grab the name out of "name1 = function name2(foo)" preferring name1
    const name = matches.name || '';
    const args = matches.args;

    return [name, args, null];
  }

  parseVar (line) {
    //   const foo = blah,
    //       foo = blah;
    //   baz.foo = blah;
    //   baz = {
    //        foo : blah
    //   }
    const regex = xregexp(
      '(?P<name>' + this.settings.varIdentifier + ')\\s*[=:]\\s*(?P<val>.*?)(?:[;,]|$)'
    );
    const matches = xregexp.exec(line, regex);
    if (matches === null) { return null; }

    return [matches.name, matches.val.trim()];
  }

  guessTypeFromValue (val) {
    const lowerPrimitives = this.editorSettings.lower_case_primitives || false;
    if (this.isNumeric(val)) { return (lowerPrimitives ? 'number' : 'Number'); }
    if ((val[0] === '"') || (val[0] === '\'')) { return (lowerPrimitives ? 'string' : 'String'); }
    if (val[0] === '[') { return 'Array'; }
    if (val[0] === '{') { return 'Object'; }
    if ((val === 'true') || (val === 'false')) { return (lowerPrimitives ? 'boolean' : 'Boolean'); }
    let regex = new RegExp('RegExp\\b|\\/[^\\/]');
    if (regex.test(val)) {
      return 'RegExp';
    }
    if (val.slice(0, 4) === 'new ') {
      regex = new RegExp(
        'new (' + this.settings.fnIdentifier + ')'
      );
      const matches = regex.exec(val);
      return (matches[0] && matches[1]) || null;
    }
    return null;
  }
};
