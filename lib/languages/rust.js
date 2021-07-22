const DocsParser = require('../docsparser');
const xregexp = require('xregexp');

module.exports = class RustParser extends DocsParser {
  setupSettings () {
    this.settings = {
      commentType: 'block',
      curlyTypes: false,
      typeInfo: false,
      typeTag: false,
      prefix: '///',
      varIdentifier: '[a-zA-Z_][a-zA-Z_0-9]*',
      fnIdentifier: '[a-zA-Z_][a-zA-Z_0-9]*',
      classIdentifier: '[A-Z_][a-zA-Z0-9]*',
      fnOpener: '^\\s*fn',
      commentCloser: '///',
      bool: 'bool',
      function: 'fn'
    };
  }

  parseClass (line) {
    // preamble looks for #[derive] and or pub if any
    const preamble = '^[\\s*\\n]*(#\\[.+\\])?[\\s\\n]*(\\bpub([(].+[)])?)?';
    const regex = xregexp(
      preamble + '\\s*(struct|trait|enum)\\s+(?P<name>' + this.settings.classIdentifier + ')'
    );

    const matches = xregexp.exec(line, regex);
    if (matches === null || matches.name === undefined) {
      return null;
    }
    const name = matches.name;
    return [name];
  }

  parseFunction (line) {
    // TODO: add regexp for closures syntax

    // preamble looks for #[derive] and or pub if any
    var preamble = '^[\\s*\\n]*(#\\[.+\\])?[\\s\\n]*(\\bpub([(].+[)])?)?';

    var regex = xregexp(
      preamble +
                '\\s*fn\\s+(?P<name>' + this.settings.fnIdentifier + ')' +
                '([<][a-zA-Z, _]+[>])?' + // Type parameters if any
                '\\s*\\(\\s*(?P<args>.*?)\\)' + // List of parameters
                '(\\s*[-][>]\\s*(?P<retval>[^{]+))?' + // Return value if any
                '\\s*[{;]?' // closing brace if any
    );

    const matches = xregexp.exec(line, regex);
    if (matches === null || matches.name === undefined) {
      return null;
    }
    const name = matches.name;
    const args = (matches.args ? matches.args.trim() : null);
    const retval = (matches.retval ? matches.retval.trim() : null);
    return [name, args, retval];
  }

  parseVar (line) {
    // TODO: add support for struct and tuple destructuring
    // TODO: parse type and value
    const preamble = '^[\\s\\n]*(#\\[.+\\])?[\\s\\n]*';
    const regex = xregexp(
      preamble +
                '\\s*let\\s+(mut\\s+)?(?P<name>' + this.settings.varIdentifier + ')'
    );

    const matches = xregexp.exec(line, regex);
    if (matches === null || matches.name === undefined) {
      return null;
    }

    const name = matches.name;
    return [name, null, null];
  }

  formatFunction (name, args, retval) {
    var out = [];
    var varCount = 1;
    out.push('${' + varCount + ':short description}');
    varCount += 1;
    out.push('');
    out.push('${' + varCount + ':long description}');
    varCount += 1;

    if (args && this.editorSettings.param_description) {
      // console.log(args);
      var lstArgs = args.split(',');
      lstArgs = lstArgs.filter(arg => arg.includes(':'));
      // console.log(lstArgs);
      if (lstArgs.length > 0) {
        out.push('');
        out.push('# Parameters');
        lstArgs.forEach(lstArg => {
          var regex = xregexp('^\\s*(?P<name>' + this.settings.varIdentifier + '):\\s*(?<type>.+)\\s*$');
          var matches = xregexp.exec(lstArg, regex);
          if (matches) {
            out.push('');
            out.push('* `' + matches.name + '` - ${' + varCount + ':' + matches.name + '}');
            varCount += 1;
          }
        });
      }
    }

    if (retval && this.editorSettings.return_description) {
      out.push('');
      out.push('# Returns');
      out.push('');
      out.push('${' + varCount + ':returns description}');
      varCount += 1;
    }

    return out;
  }

  formatClass (name) {
    return ['${1:describe ' + name + '}'];
  }

  formatVar (name, val, valType) {
    return ['${1:describe ' + name + '}'];
  }
};
