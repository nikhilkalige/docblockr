var DocsParser = require('../docsparser');
var xregexp = require('../xregexp').XRegExp;

function PythonParser(settings) {
    console.log("Setting pyparser");
    DocsParser.call(this, settings);
}

PythonParser.prototype = Object.create(DocsParser.prototype);

PythonParser.prototype.setup_settings = function() {
    var shortPrimitives = this.editor_settings.short_primitives || false;
    var nameToken = '\*{0,2}[a-zA-Z_][a-zA-Z_0-9]*'
    this.settings = {
        'commentType': 'block',
        // curly brackets around the type information
        'curlyTypes': false,
        'typeInfo': true,
        'typeTag': 'type',
        'varIdentifier': nameToken + '(?:->' + nameToken + ')*',
        'fnIdentifier': nameToken,
        'classIdentifier': nameToken,
        'fnOpener': 'def\\s+(?:\\s+' + nameToken + ')?\\s*\\(',
        'prefix' : "",
        'commentCloser': '"""',
        'bool': (shortPrimitives ? 'bool' : 'boolean'),
        'function': 'function'
    };
};

PythonParser.prototype.parse_class = function(line) {
    var regex = xregexp(
        '^\\s*class\\s+' +
        '(?P<name>' + this.settings.classIdentifier + ')'
    );

    var matches = xregexp.exec(line, regex);
    if(matches === null)
        return null;

    return [matches.name];
};

PythonParser.prototype.parse_function = function(line) {
    var r = '^\\s*(def\\s+&?(?:\\s+)?' +
            '(?P<name>' + this.settings.fnIdentifier + ')' +
            // def fnName
            // (arg1, arg2):
            '\\s*\\(\\s*(?P<args>.*?)\\)\s*' +
            ')?:'
    var regex = xregexp(r);

    var matches = xregexp.exec(line, regex);
    if(matches === null)
        return null;

    return [matches.name, (matches.args ? matches.args.trim() : null), (matches.retval ? matches.retval.trim() : null)];
};

PythonParser.prototype.get_arg_type = function(arg) {
    return null;
};

PythonParser.prototype.get_arg_name = function(arg) {
    var regex = new RegExp(
        '(' + this.settings.varIdentifier + ')(?:\\s*=.*)?$'
    );
    var matches = regex.exec(arg);
    return matches[1];
};

PythonParser.prototype.parse_var = function(line) {
    /*
        foo = blah,
        baz.foo = blah;
        $baz = {
             'foo' : blah
           }
    */
    var r = '^\\s*(?:(?P<modifier>var|static|const|(?:final)(?:public|private|protected)(?:\\s+final)(?:\\s+static)?)\\s+)?' +
            '(?P<name>' + this.settings.varIdentifier + ')' +
            '(?:\\s*=>?\\s*(?P<val>.*?)(?:[;,]|$))?';
    var regex = xregexp(r);
    var matches = xregexp.exec(line, regex);
    if(matches !== null)
        return [matches.name, (matches.val ? matches.val.trim() : null)];

    return null;
};

PythonParser.prototype.guess_type_from_value = function(val) {
    var short_primitives = this.editor_settings.short_primitives || false;
    if(this.is_numeric(val)) {
        if(val.indexOf('.') > -1)
            return 'float';

        return (short_primitives ? 'int' : 'integer');
    }
    if((val[0] == '"') || (val[0] == '\''))
        return 'string';
    if(val.slice(0,5) == 'array' || val[0] == '[')
        return 'array';
    var values = ['true', 'false', 'filenotfound'];
    if (values.indexOf(val.toLowerCase()) !== -1) {
        return (short_primitives ? 'bool' : 'boolean');
    }

    if(val.slice(0,4) == 'new ') {
        var regex = new RegExp(
            'new (' + this.settings.fnIdentifier + ')'
        );
        var matches = regex.exec(val);
        return (matches[0] && matches[1]) || null;
    }
    return null;
};

PythonParser.prototype.get_function_return_type = function(name, retval) {
  if(retval) {
      return retval;
  }
  return DocsParser.prototype.get_function_return_type.call(this, name, retval);
};

PythonParser.prototype.get_definition = function(editor, pos, readLine) {
    var maxLines = 25;

    var definition = '';

    var removedStrings, match, line;
    pos.row -= 1;
    for(var i = 0; i < maxLines; i++) {
        line = readLine(editor, pos);
        console.log('Line:'+line);
        pos.row -= 1;

        // null, undefined or invaild
        if(typeof line !== 'string') {
            break;
        }
        line = line
            // strip one line comments
            .replace(/#.*$/g, '')
            // strip block comments
            // // strip strings
            // .replace(/'(?:\\.|[^'])*'/g, '\'\'')
            // .replace(/"(?:\\.|[^"])*"/g, '""')
            // // strip leading whitespace
            .replace(/^\s+/, '');
        definition = line + definition;
        if(definition.match(/^\s*def\s*\w*\(.*?\):/g)){
          console.log("fundef foudn")
          break;
        }
    }
    if(definition.match(/""".*?"""/g)){
      return '';
    }
    definition = definition.replace(/""".*?"""/g, '').replace(/"""/g, '')
    console.log("get_def")
    console.log(definition)
    return definition;
};

module.exports = PythonParser;
