const DocsParser = require('../docsparser');
const xregexp = require('xregexp');
const util = require('util');

module.exports = class TypescriptParser extends DocsParser {
  setup_settings () {
    const identifier = '[a-zA-Z_$][a-zA-Z_$0-9]*';
    const baseTypeIdentifier = util.format('%s(\\.%s)*(\\[\\])?', identifier, identifier);
    const parametricTypeIdentifier = util.format('%s(\\s*<\\s*%s(\\s*,\\s*%s\\s*)*>)?', baseTypeIdentifier, baseTypeIdentifier, baseTypeIdentifier);
    this.settings = {
      commentType: 'block',
      // curly brackets around the type information
      curlyTypes: true,
      typeInfo: false,
      typeTag: 'type',
      // technically, they can contain all sorts of unicode, but w/e
      varIdentifier: identifier,
      fnIdentifier: identifier,
      fnOpener: 'function(?:\\s+' + identifier + ')?\\s*\\(',
      commentCloser: ' */',
      bool: 'Boolean',
      function: 'Function',
      functionRE:
              // Modifiers
              '(?:public|private|static)?\\s*' +
              // Method name
              '(?P<name>' + identifier + ')\\s*' +
              // Params
              '\\((?P<args>.*?)\\)\\s*' +
              // Return value
              '(:\\s*(?P<retval>' + parametricTypeIdentifier + '))?',
      var_re:
              '((public|private|static|var)\\s+)?(?P<name>' + identifier +
              ')\\s*(:\\s*(?P<type>' + parametricTypeIdentifier +
              '))?(\\s*=\\s*(?P<val>.*?))?([;,]|$)'
    };
  }

  parse_function (line) {
    line = line.trim();
    const regex = xregexp(this.settings.functionRE);
    const matches = xregexp.exec(line, regex);
    if (matches === null) { return null; }

    return [matches.name, matches.args, matches.retval];
  }

  get_arg_type (arg) {
    if (arg.indexOf(':') > -1) {
      const argList = arg.split(':');
      return argList[argList.length - 1].trim();
    }
    return null;
  }

  get_arg_name (arg) {
    if (arg.indexOf(':') > -1) { arg = arg.split(':')[0]; }

    const pubPrivPattern = /\b(public|private)\s+|/g;
    arg = arg.replace(pubPrivPattern, '');

    const regex = /[ ?]/g;
    return arg.replace(regex, '');
  }

  parse_var (line) {
    const regex = xregexp(this.settings.var_re);
    const matches = xregexp.exec(line, regex);
    if (matches == null) { return null; }
    let val = matches.val;
    if (val != null) { val = val.trim(); }

    return [matches.name, val, matches.type];
  }

  get_function_return_type (name, retval) {
    if (name === 'constructor') {
      return null;
    }
    return ((retval !== 'void') ? retval : null);
  }

  guess_type_from_value (val) {
    const lowerPrimitives = this.editor_settings.lower_case_primitives || false;
    if (this.is_numeric(val)) { return (lowerPrimitives ? 'number' : 'Number'); }
    if ((val[0] === '\'') || (val[0] === '"')) { return (lowerPrimitives ? 'string' : 'String'); }
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
