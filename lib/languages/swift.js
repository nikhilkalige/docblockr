var DocsParser = require("../docsparser");
var xregexp = require('../xregexp').XRegExp;
var util = require('util');

function SwiftParser(settings) {
    DocsParser.call(this, settings);
}

SwiftParser.prototype = Object.create(DocsParser.prototype);

SwiftParser.prototype.setup_settings = function() {
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
            '(->\\s*(?P<retval>' + parametric_type_identifier + '))?',
        'var_re':
            '((public|private|static|var|let)\\s+)?(?P<name>' + identifier +
            ')\\s*(:\\s*(?P<type>' + parametric_type_identifier +
            '))?(\\s*=\\s*(?P<val>.*?))?([;,]|$)'
    };
};

SwiftParser.prototype.parse_function = function(line) {
    line = line.trim();
    var regex = xregexp(this.settings.functionRE);
    var matches = xregexp.exec(line, regex);
    if(matches === null)
        return null;
    return [matches.name, matches.args, matches.retval];
};

SwiftParser.prototype.get_arg_type = function(arg) {
    if(arg.indexOf(':') > -1) {
        var arg_list = arg.split(':');
        return arg_list[arg_list.length - 1].trim();
    }
    return null;
};

SwiftParser.prototype.get_arg_name = function(arg) {
    if(arg.indexOf(':') > -1)
        arg = arg.split(':')[0];

    var regex = /[ \?]/g;
    return arg.replace(regex, '');
};

SwiftParser.prototype.parse_var = function(line) {
    var regex = xregexp(this.settings.var_re);
    var matches = xregexp.exec(line, regex);
    if(matches == null)
        return null;
    var val = matches.val;
    if(val != null)
        val = val.trim();

    return [matches.name, val, matches.type];
};

SwiftParser.prototype.get_function_return_type = function(name, retval) {
    return ((retval != undefined) ? retval : null);
};

SwiftParser.prototype.guess_type_from_value = function(val) {
    var lowerPrimitives = this.editor_settings.lower_case_primitives || false;
    if(this.is_numeric(val))
        return (lowerPrimitives ? 'double' : 'Double');
    if((val[0] == '\'') || (val[0] == '"'))
        return (lowerPrimitives ? 'string' : 'String');
    if(val[0] == '[')
        return 'Array';
    if(val[0] == '{')
        return 'Dictonary';
    if((val == 'true') || (val == 'false'))
        return (lowerPrimitives ? 'boolean' : 'Boolean');
    var regex = new RegExp('RegExp\\b|\\/[^\\/]');
    if(regex.test(val)) {
        return 'RegExp';
    }
    return null;
};

module.exports = SwiftParser;
