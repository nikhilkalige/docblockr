var DocsParser = require("../docsparser");
var xregexp = require('../xregexp').XRegExp;

function PhpParser(settings) {
    DocsParser.call(this, settings);
}

PhpParser.prototype = Object.create(DocsParser.prototype);

PhpParser.prototype.setup_settings = function() {
    var shortPrimitives = this.editor_settings.short_primitives || false;
    var nameToken = '[a-zA-Z_\\x7f-\\xff][a-zA-Z0-9_\\x7f-\\xff]*'
    this.settings = {
        // curly brackets around the type information
        'curlyTypes': false,
        'typeInfo': true,
        'typeTag': 'var',
        'varIdentifier': '[$]' + nameToken + '(?:->' + nameToken + ')*',
        'fnIdentifier': nameToken,
        'fnOpener': 'function(?:\\s+' + nameToken + ')?\\s*\\(',
        'commentCloser': ' */',
        'bool': (shortPrimitives ? 'bool' : 'boolean'),
        'function': 'function'
    };
};

PhpParser.prototype.parse_function = function(line) {
    var regex = xregexp(
        'function\\s+&?(?:\\s+)?' +
        '(?P<name>' + this.settings.fnIdentifier + ')' +
        // function fnName
        // (arg1, arg2)
        '\\s*\\(\\s*(?P<args>.*?)\\)'
        );

    var matches = xregexp.exec(line, regex);
    if(matches === null)
        return null;

    return [matches.name, matches.args, null];
};

PhpParser.prototype.get_arg_type = function(arg) {
    // function add($x, $y = 1)
    var regex = xregexp(
        '(?P<name>' + this.settings.varIdentifier + ')\\s*=\\s*(?P<val>.*)'
        );

    var matches = xregexp.exec(arg, regex);
    if(matches !== null)
        return this.guess_type_from_value(matches.val);

    // function sum(Array $x)
    if(arg.search(/\S\s/) > -1) {
        matches = /^(\S+)/.exec(arg);
        return matches[1];
    }
    else
        return null;
};

PhpParser.prototype.get_arg_name = function(arg) {
    var regex = new RegExp(
        '(' + this.settings.varIdentifier + ')(?:\\s*=.*)?$'
        );
    var matches = regex.exec(arg);
    return matches[1];
};

PhpParser.prototype.parse_var = function(line) {
    /*
        var $foo = blah,
            $foo = blah;
        $baz->foo = blah;
        $baz = array(
             'foo' => blah
        )
    */
    var regex = xregexp(
        '(?P<name>' + this.settings.varIdentifier + ')\\s*=>?\\s*(?P<val>.*?)(?:[;,]|$)'
        );
    var matches = xregexp.exec(line, regex);
    if(matches !== null)
        return [matches.name, matches.val.trim()];

    regex = xregexp(
        '\\b(?:var|public|private|protected|static)\\s+(?P<name>' + this.settings.varIdentifier + ')'
        );
    matches = xregexp.exec(line, regex);
    if(matches !== null)
        return [matches.name, null];

    return null;
};

PhpParser.prototype.guess_type_from_value = function(val) {
    var short_primitives = this.editor_settings.short_primitives || false;
    if(this.is_numeric(val)) {
        if(val.indexOf('.') > -1)
            return 'float';

        return (short_primitives ? 'int' : 'integer');
    }
    if((val[0] == '"') || (val[0] == '\''))
        return 'string';
    if(val.slice(0,5) == 'array')
        return 'array';

    var values = ['true', 'false', 'filenotfound'];
    var i, len;
    for(i = 0; len = values.length, i < len; i++) {
        if(name == values[i])
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

PhpParser.prototype.get_function_return_type = function(name, retval) {
    var shortPrimitives = this.editor_settings.short_primitives || false;
    if (name.slice(0,2) == '__'){
        var values = ['__construct', '__destruct', '__set', '__unset', '__wakeup'];
        var i, len;
        for(i = 0; len = values.length, i < len; i++) {
            if(name == values[i])
                return null;
        }
        if(name == '__sleep')
            return 'array';
        if(name == '__toString')
            return 'string';
        if(name == '__isset')
            return (shortPrimitives ? 'bool' : 'boolean');
    }
    return DocsParser.prototype.get_function_return_type.call(this, name, retval);
};

module.exports = PhpParser;
