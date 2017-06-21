var DocsParser = require("../docsparser");
var xregexp = require('../xregexp').XRegExp;
var util = require('util');

function CppParser(settings) {
    //this.setup_settings();
    // call parent constructor
    DocsParser.call(this, settings);
}

CppParser.prototype = Object.create(DocsParser.prototype);

CppParser.prototype.setup_settings = function() {
    var name_token = '[a-zA-Z_][a-zA-Z0-9_]*';
    var identifier = util.format('(%s)(::%s)?(<%s>)?', name_token, name_token, name_token);
    this.settings = {
        'typeInfo': false,
        'curlyTypes': false,
        'typeTag': 'param',
        'commentCloser': ' */',
        'fnIdentifier': identifier,
        'varIdentifier': '(' + identifier + ')\\s*(?:\\[(?:' + identifier + ')?\\]|\\((?:(?:\\s*,\\s*)?[a-z]+)+\\s*\\))?',
        'fnOpener': identifier + '\\s+' + identifier + '\\s*\\(',
        'bool': 'bool',
        'function': 'function'
    };
};

CppParser.prototype.parse_function = function(line) {
    var regex = xregexp(
        '((?P<retval>' + this.settings.varIdentifier + ')[&*\\s]+)?' +
        '(?P<name>' + this.settings.varIdentifier + ');?' +
        // void fnName
        // (arg1, arg2)
        '\\s*\\(\\s*(?P<args>.*?)\\)'
    );
    var matches = xregexp.exec(line, regex);

    if(matches === null) {
      return null;
    }

    var args = matches.args || null
    var retval = matches.retval || null

    return [matches.name, args, retval];
};

CppParser.prototype.parse_args = function(args) {
    if(args.trim() === 'void')
        return [];
    return DocsParser.prototype.parse_args.call(this, args);
    //return super(JsdocsCPP, self).parseArgs(args)
};

CppParser.prototype.get_arg_type = function(arg) {
    if(arg === "...") {
        // variable arguments
        return "VARARGS";
    }
    var regex = new RegExp('(' + this.settings.varIdentifier + '[&*\\s]+)');
    var arrayRegex = new RegExp('[^[]+\\s*(\\[\\])?')
    var matches = regex.exec(arg) || [];
    var arrayMatches = arrayRegex.exec(arg) || [];
    var result = (matches[1] || "[type]").replace(/\s+/g, "");
    var arrayResult = (arrayMatches[1] || "").replace(/\s+/g, "");
    return result + arrayResult;
};

CppParser.prototype.get_arg_name = function(arg) {
    if(arg === "...") {
        // variable arguments
        return "VARARGS";
    }
    var regex = new RegExp(this.settings.varIdentifier + '(?:\s*=.*)?$');
    var matches = regex.exec(arg) || [];
    return matches[1] || "[name]";
};

CppParser.prototype.parse_var = function(line) {
    return null;
};

CppParser.prototype.guess_type_from_value = function(val) {
    return null;
};

CppParser.prototype.get_function_return_type = function(name, retval) {
    return ((retval != 'void') ? retval : null);
};

module.exports = CppParser;
