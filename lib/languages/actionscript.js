var DocsParser = require("../docsparser");
var xregexp = require('../xregexp').XRegExp;

function ActionscriptParser(settings) {
    DocsParser.call(this, settings);
}

ActionscriptParser.prototype = Object.create(DocsParser.prototype);

ActionscriptParser.prototype.setup_settings = function() {
    var nameToken = '[a-zA-Z_][a-zA-Z0-9_]*';
    this.settings = {
        'typeInfo': false,
        'curlyTypes': false,
        'typeTag': '',
        'commentCloser': ' */',
        'fnIdentifier': nameToken,
        'varIdentifier': '(%s)(?::%s)?' % (nameToken, nameToken),
        'fnOpener': 'function(?:\\s+[gs]et)?(?:\\s+' + nameToken + ')?\\s*\\(',
        'bool': 'bool',
        'function': 'function'
    };
};

ActionscriptParser.prototype.parse_function = function(line) {
    var regex = xregexp(
        // fnName = function,  fnName : function
        '(?:(?P<name1>' + this.settings.varIdentifier + ')\\s*[:=]\\s*)?' +
        'function(?:\\s+(?P<getset>[gs]et))?' +
        // function fnName
        '(?:\\s+(?P<name2>' + this.settings.fnIdentifier + '))?' +
        // (arg1, arg2)
        '\\s*\\(\\s*(?P<args>.*?)\\)'
    );
    var matches = xregexp.exec(line, xregexp);
    if(matches === null)
        return null;

    regex = new RegExp(this.settings.varIdentifier, 'g');
    var name = matches.name1 && (matches.name1 || matches.name2 || '').replace(regex, '\\1');
    var args = matches.args;
    var options = {};
    if(matches.getset == 'set')
        options.as_setter = true;

    return[name, args, null, options];
};

ActionscriptParser.prototype.parse_var = function(line) {
    return null;
};

ActionscriptParser.prototype.get_arg_name = function(arg) {
    var regex = new RegExp(this.settings.varIdentifier + '(\\s*=.*)?', 'g');
    return arg.replace(regex, '\\1');
};

ActionscriptParser.prototype.get_arg_type = function(arg) {
    // could actually figure it out easily, but it's not important for the documentation
    return null;
};

module.exports = ActionscriptParser;
