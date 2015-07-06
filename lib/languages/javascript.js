var DocsParser = require("../docsparser");
var xregexp = require('../xregexp').XRegExp;

function JsParser(settings) {
    // this.setup_settings();
    // call parent constructor
    DocsParser.call(this, settings);
}

JsParser.prototype = Object.create(DocsParser.prototype);

JsParser.prototype.setup_settings = function() {
    var identifier = '[a-zA-Z_$][a-zA-Z_$0-9]*';
    this.settings = {
        // curly brackets around the type information
        'curlyTypes': true,
        'typeInfo': true,
        'typeTag': 'type',
        // technically, they can contain all sorts of unicode, but w/e
        'varIdentifier': identifier,
        'fnIdentifier':  identifier,
        'fnOpener': 'function(?:\\s+' + identifier + ')?\\s*\\(',
        'commentCloser': ' */',
        'bool': 'Boolean',
        'function': 'Function'
    };
};

JsParser.prototype.parse_function = function(line) {
    // (?:(?([a-zA-Z_$][a-zA-Z_$0-9]*)\\s*[:=]\\s*)?(?:function\\*|get|set)\\s+)(?:([a-zA-Z_$][a-zA-Z_$0-9]*))?\\s*\\(\\s*(.*)\\)
    var regex = xregexp(
        //   fnName = function,  fnName : function
        '(?:(?:(?P<name1>' + this.settings.varIdentifier + ')\\s*[:=]\\s*)?' +
        '(?:function\\*?|get|set)\\s+)?' +
        // function fnName
        '(?:(?P<name2>' + this.settings.fnIdentifier + '))?' +
        // (arg1, arg2)
        '\\s*\\(\\s*(?P<args>.*?)\\)'
    );

    var matches = xregexp.exec(line, regex);
    if(matches === null) {
        return null;
    }
    // grab the name out of "name1 = function name2(foo)" preferring name1
    var name = matches.name1 || matches.name2 || '';
    var args = matches.args;
    return [name, args, null];
};

JsParser.prototype.parse_var = function(line) {
        //   var foo = blah,
        //       foo = blah;
        //   baz.foo = blah;
        //   baz = {
        //        foo : blah
        //   }
    var regex = xregexp('(?P<name>' + this.settings.varIdentifier + ')\\s*[=:]\\s*(?P<val>.*?)(?:[;,]|$)');
    var matches = xregexp.exec(line, regex);
    if(matches === null) {
        return null;
    }
    // variable name, variable value
    return [matches.name, matches.val.trim()];
};

JsParser.prototype.guess_type_from_value = function(val) {
    var lower_primitives = this.editor_settings.lower_case_primitives || false;
    var short_primitives = this.editor_settings.short_primitives || false;
    var var_type;
    var capitalize = function(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };
    if(this.is_numeric(val)) {
        var_type = 'number';
        return (lower_primitives ? var_type : capitalize(var_type));
    }
    if((val[0] === '\'') || (val[0] === '"')) {
        var_type = 'string';
        return (lower_primitives ? var_type : capitalize(var_type));
    }
    if(val[0] === '[') {
        return 'Array';
    }
    if(val[0] === '{') {
        return 'Object';
    }
    if((val === 'true') || (val === 'false')) {
        var ret_val = (short_primitives ? 'Bool' : 'Boolean');
        return (lower_primitives ? ret_val : capitalize(ret_val));
    }
    var regex = new RegExp('RegExp\\b|\\\/[^\\/]');
    if(regex.test(val)) {
        return 'RegExp';
    }
    if(val.slice(0, 4) === 'new ') {
        regex = new RegExp('new (' + this.settings.fnIdentifier + ')');
        var matches = regex.exec(val);
        return (matches[0] && matches[1]) || null;
    }
    return null;
};

module.exports = JsParser;
