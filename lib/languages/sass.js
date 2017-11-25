var util = require('util');
var DocsParser = require('../docsparser');
var xregexp = require('xregexp');

function SassParser(settings) {
    // this.setup_settings();
    // call parent constructor
    DocsParser.call(this, settings);
}

SassParser.prototype = Object.create(DocsParser.prototype);

SassParser.prototype.setup_settings = function() {
    var identifier = '[a-zA-Z_-][a-zA-Z_0-9-]*';
    this.settings = {
        'commentType': 'single',
        'curlyTypes': true,
        'typeInfo': true,
        'typeTag': 'type',
        'prefix': '///',
        'varIdentifier': '\\$' + identifier,
        'fnIdentifier':  identifier,
        'fnOpener': '@(?:mixin|function)\\s+' + identifier + '\\s*[\\(|\\{]',
        'bool': 'Boolean'
    };
};

SassParser.prototype.parse_function = function(line) {
    var r = '^\\s*@(?P<fnType>(mixin|function))\\s+' +
        '(?P<name>' + this.settings.fnIdentifier + ')' +
        '\\s*(?:\\(\\s*(?P<args>.*?)\\)|{)';
    var regex = xregexp(r);

    var matches = xregexp.exec(line, regex);
    if(matches === null)
        return null;

    return [
        matches.name,
        (matches.args ? matches.args.trim() : null),
        (matches.fnType == 'mixin' ? null : false)
    ];
};

SassParser.prototype.parse_var = function(line) {
    //   $foo: blah;
    var r = '(?P<name>' + this.settings.varIdentifier + ')' +
        '\\s*:\\s*(?P<val>.*?)(?:;|$)';
    var regex = xregexp(r);

    var matches = xregexp.exec(line, regex);

    if(matches === null) {
        return null;
    }
    // variable name, variable value
    return [matches.name, matches.val.trim()];
};

SassParser.prototype.parse_arg = function(arg) {

    var regex = xregexp(
        '(?P<name>' + this.settings.varIdentifier + ')(\\s*:\\s*(?P<value>.*))?'
    );

    return xregexp.exec(arg, regex);
};

SassParser.prototype.get_arg_type = function(arg) {

    var matches = this.parse_arg(arg);

    if(matches && matches.value) {
        return this.guess_type_from_value(matches.value);
    }

    return null;
};

SassParser.prototype.get_arg_name = function(arg) {

    var matches = this.parse_arg(arg);

    if (matches && matches.value) {
        return util.format('%s [%s]', matches.name, matches.value);
    } else if (matches && matches.name) {
        return matches.name;
    }

    // a invalid name was passed
    return null;
};

SassParser.prototype.guess_type_from_value = function(val) {
    var short_primitives = this.editor_settings.short_primitives || false;

    // It doesn't detect string without quotes, because it could be a color name
    // It doesn't detect empty lists or maps, because they have the same syntax

    if(this.is_map(val)) {
        return 'map';
    }
    if(this.is_list(val)) {
        return 'list';
    }
    if(this.is_numeric(val[0])) {
        return 'number';
    }
    if((val[0] === '\'') || (val[0] === '"')) {
        return 'string';
    }
    if(val === 'null') {
        return 'null';
    }
    if((val === 'true') || (val === 'false')) {
        return (short_primitives ? 'Bool' : 'Boolean');
    }
    if(this.is_color(val)) {
        return 'color';
    }

    return null;
};

SassParser.prototype.get_function_return_type = function(name, retval) {
    if(retval) {
        return retval;
    }

    return DocsParser.prototype.get_function_return_type.call(this, name, retval);
};

SassParser.prototype.is_color = function(val) {
    var expr = new RegExp('^('+
        // #FFF
        '#[0-9a-f]{3}'+
        '|'+
        // #EFEFEF
        // #02060901
        '#(?:[0-9a-f]{2}){2,4}'+
        '|'+
        // rgb(0,0,0)
        // hsla(0,0,0,0)
        // hsl(0,0,0,0)
        // rgba(0,0,0)
        '(rgb|hsl)a?\\((-?\\d+%?[,\\s]+){2,3}\\s*[\\d\\.]+%?\\))'+
        '$', 'i');
    return expr.test(val);
};

SassParser.prototype.is_map = function(val) {
    var expr = new RegExp('^\\(\\s*'+ this.settings.fnIdentifier +'\\s*:');
    return expr.test(val);
};

SassParser.prototype.is_list = function(val) {
    var expr = new RegExp('^('+
        // [example, list]
        '\\[' +
        '|' +
        // (example, list)
        '\\(' +
        ')?' +
        // example list
        // example, list
        '[a-zA-Z_0-9$][a-zA-Z_0-9-]*([,\\s]+[a-zA-Z_0-9$][a-zA-Z_0-9-]*)+' +
        '(\\]|\\))?$');
    return expr.test(val);
};

module.exports = SassParser;
