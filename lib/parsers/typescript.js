var DocsParser = require("../docsparser");
var xregexp = require('../xregexp').XRegExp;
var util = require('util');

function TypescriptParser(settings) {
    DocsParser.call(this, settings);
}

TypescriptParser.prototype = Object.create(DocsParser.prototype);

TypescriptParser.prototype.setup_settings = function() {
    var identifier = '[a-zA-Z_$][a-zA-Z_$0-9]*';
    var base_type_identifier = util.format('%s(\\.%s)*(\\[\\])?', identifier, identifier);
    var parametric_type_identifier = util.format('%s(\\s*<\\s*%s(\\s*,\\s*%s\\s*)*>)?', base_type_identifier, base_type_identifier, base_type_identifier);
    this.settings = {
        // curly brackets around the type information
        'curlyTypes': true,
        'typeInfo': true,
        'typeTag': 'type',
        // technically, they can contain all sorts of unicode, but w/e
        'varIdentifier': identifier,
        'fnIdentifier': identifier,
        'fnOpener': 'function(?:\\s+' + identifier + ')?\\s*\\(',
        'commentCloser': ' */',
        'bool': 'Boolean',
        'function': 'Function',
        'functionRE':
            // Modifiers
            '(?:public|private|static)?\\s*' +
            // Method name
            '(?P<name>' + identifier + ')\\s*' +
            // Params
            '\\((?P<args>.*?)\\)\\s*' +
            // Return value
            '(:\\s*(?P<retval>' + parametric_type_identifier + '))?',
        'var_re':
            '((public|private|static|var)\\s+)?(?P<name>' + identifier +
            ')\\s*(:\\s*(?P<type>' + parametric_type_identifier +
            '))?(\\s*=\\s*(?P<val>.*?))?([;,]|$)'
    };
};

TypescriptParser.prototype.parse_function = function(line) {
    line = line.trim();
    var regex = xregexp(this.settings.functionRE);
    var matches = xregexp.exec(line, regex);
    if(matches === null)
        return null;

    return [matches.name, matches.args, matches.retval];
};

TypescriptParser.prototype.get_arg_type = function(arg) {
    if(arg.indexOf(':') > -1) {
        var arg_list = arg.split(':');
        return arg_list[arg_list.length - 1].trim();
    }
    return null;
};

TypescriptParser.prototype.get_arg_name = function(arg) {
    if(arg.indexOf(':') > -1)
        arg = arg.split(':')[0];

    var regex = /[ \?]/g;
    return arg.replace(regex, '');
};

TypescriptParser.prototype.parse_var = function(line) {
    var regex = xregexp(this.settings.var_re);
    var matches = xregexp.exec(line, regex);
    if(matches == null)
        return null;
    var val = matches.val;
    if(val != null)
        val = val.trim();

    return [matches.name, val, matches.type];
};

TypescriptParser.prototype.get_function_return_type = function(name, retval) {
    return ((retval != 'void') ? retval : null);
};

TypescriptParser.prototype.guess_type_from_value = function(val) {
    var lowerPrimitives = this.editor_settings.lower_case_primitives || false;
    if(this.is_numeric(val))
        return (lowerPrimitives ? 'number' : 'Number');
    if((val[0] == '\'') || (val[0] == '"'))
        return (lowerPrimitives ? 'string' : 'String');
    if(val[0] == '[')
        return 'Array';
    if(val[0] == '{')
        return 'Object';
    if((val == 'true') || (val == 'false'))
        return (lowerPrimitives ? 'boolean' : 'Boolean');
    var regex = new RegExp('RegExp\\b|\\/[^\\/]');
    if(regex.test(val)) {
        return 'RegExp';
    }
    if(val.slice(0,4) == 'new ') {
        regex = new RegExp(
            'new (' + this.settings.fnIdentifier + ')'
            );
        var matches = regex.exec(val);
        return (matches[0] && matches[1]) || null;
    }
    return null;
};

module.exports = TypescriptParser;
