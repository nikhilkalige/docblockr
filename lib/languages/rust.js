const DocsParser = require('../docsparser');
const xregexp = require('xregexp');

module.exports = class RustParser extends DocsParser {
  setupSettings () {
    this.settings = {
        'commentType': 'block',
        'curlyTypes': false,
        'typeInfo': false,
        'typeTag': false,
        'prefix': '///',
        'varIdentifier': '[a-zA-Z_][a-zA-Z_0-9]*',
        'fnIdentifier': '[a-zA-Z_][a-zA-Z_0-9]*',
        'classIdentifier': '[A-Z_][a-zA-Z0-9]*',
        'fnOpener': '^\\s*fn',
        'commentCloser': '///',
        'bool': 'bool',
        'function': 'fn'
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
};

parseVar (line) {
    // TODO: add support for struct and tuple destructuring
    // TODO: parse type and value
    const preamble = '^[\\s*\\n]*(#\\[[^[]+\\])?[\\s*\\n]*';
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
    var var_count = 1;
    out.push('${' + var_count + ':short description}');
    var_count += 1;
    out.push('');
    out.push('${' + var_count + ':long description}');
    var_count += 1;

    if (args) {
        // console.log(args);
        var lst_args = args.split(',');
        lst_args = lst_args.filter(arg => arg.includes(':'));
        // console.log(lst_args);
        if (lst_args.length > 0) {
            out.push('');
            out.push('# Parameters');
            lst_args.forEach(lst_arg => {
                var regex = xregexp('^\\s*(?P<name>' + this.settings.varIdentifier + '):\\s*(?<type>.+)\\s*$');
                var matches = xregexp.exec(lst_arg, regex);
                if (matches) {
                    out.push('');
                    out.push('* `' + matches.name + '` - ${' + var_count + ':' + matches.name + '}');
                    var_count += 1;
                }
            });
        }
    }

    if (retval) {
        out.push('');
        out.push('# Returns');
        out.push('');
        out.push('${' + var_count + ':returns description}');
        var_count += 1;
    }

    return out;
};

formatClass (name) {
    return ['${1:describe ' + name + '}'];
}

formatVar (name, val, valType) {
    return ['${1:describe ' + name + '}'];
};
