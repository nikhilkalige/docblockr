const DocsParser = require('../docsparser');
const xregexp = require('xregexp');

module.exports = class ObjCParser extends DocsParser {
  setupSettings () {
    const identifier = '[a-zA-Z_$][a-zA-Z_$0-9]*';
    this.settings = {
      commentType: 'block',
      // curly brackets around the type information
      curlyTypes: true,
      typeInfo: true,
      typeTag: 'type',
      // technically, they can contain all sorts of unicode, but w/e
      varIdentifier: identifier,
      fnIdentifier: identifier,
      fnOpener: '^\\s*[-+]',
      commentCloser: ' */',
      bool: 'Boolean',
      function: 'Function'
    };
  }

  getDefinition (editor, pos, readLine) {
    const maxLines = 25; // don't go further than this

    let definition = '';
    for (let i = 0; i < maxLines; i++) {
      let line = readLine(editor, pos);
      if (line == null) { break; }

      // goto next line
      pos.row += 1;
      // strip comments
      line = line.replace(/\/\/.*/, '');
      if (definition === '') {
        if ((!this.settings.fnOpener) || !(line.search(RegExp(this.settings.fnOpener)) > -1)) {
          definition = line;
          break;
        }
      }
      definition += line;
      if ((line.indexOf(';') > -1) || (line.indexOf('{') > -1)) {
        const regex = new RegExp('\\s*[;{]\\s*$', 'g');
        definition = definition.replace(regex, '');
        break;
      }
    }
    return definition;
  }

  parseFunction (line) {
    // this is terrible, don't judge me
    const typeRegex = '[a-zA-Z_$][a-zA-Z0-9_$]*\\s*\\**';
    let regex = xregexp(
      '[-+]\\s+\\(\\s*(?P<retval>' + typeRegex + ')\\s*\\)\\s*' +
          '(?P<name>[a-zA-Z_$][a-zA-Z0-9_$]*)' +
          // void fnName
          // (arg1, arg2)
          '\\s*(?::(?P<args>.*))?'
    );

    const matches = xregexp.exec(line, regex);
    if (matches == null) { return null; }

    let name = matches.name;
    const argStr = matches.args;
    const args = [];
    let result;

    if (argStr) {
      regex = /\s*:\s*/g;
      const groups = argStr.split(regex);
      const numGroups = groups.length;
      for (let i = 0; i < numGroups; i++) {
        let group = groups[i];
        if (i < (numGroups - 1)) {
          regex = /\s+(\S*)$/g;
          result = group.exec(regex);
          name += ':' + result[1];
          group = group.slice(0, result.index);
        }
        args.push(group);
      }
      if (numGroups) { name += ':'; }
    }
    return [name, args.join('|||'), matches.retval];
  }

  parseArgs (args) {
    const out = [];
    const argList = args.split('|||');
    for (let i = 0; i < argList.length; i++) {
      const arg = argList[i];
      const lastParen = arg.lastIndexOf(')');
      out.push(arg.split(1, lastParen), arg.split(lastParen + 1));
    }
    return out;
  }

  getFunctionReturnType (name, retval) {
    if ((retval !== 'void') && (retval !== 'IBAction')) { return retval; } else { return null; }
  }

  parseVar (line) {
    return null;
  }
};
