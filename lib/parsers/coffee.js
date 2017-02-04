var DocsParser = require("../docsparser");
var xregexp = require('../xregexp').XRegExp;

function CoffeeParser(settings) {
    DocsParser.call(this, settings);
}

CoffeeParser.prototype = Object.create(DocsParser.prototype);

CoffeeParser.prototype.setup_settings = function() {
    var identifier = '[a-zA-Z_$][a-zA-Z_$0-9]*';
    this.settings = {
        // curly brackets around the type information
        'curlyTypes': true,
        'typeTag': this.editor_settings.override_js_var || 'type',
        'typeInfo': true,
        // technically, they can contain all sorts of unicode, but w/e
        'varIdentifier': identifier,
        'fnIdentifier': identifier,
        'fnOpener': null,  // no multi-line function definitions for you, hipsters!
        'commentCloser': '###',
        'bool': 'Boolean',
        'function': 'Function'
    };
};

CoffeeParser.prototype.parse_function = function(line) {
    var regex = xregexp(
        // fnName = function,  fnName : function
        '(?:(?P<name>' + this.settings.varIdentifier + ')\\s*[:=]\\s*)?' +
        '(?:\\((?P<args>[^()]*?)\\))?\\s*([=-]>)'
        );
    var matches = xregexp.exec(line, regex);
    if(matches === null)
        return null;

    // grab the name out of "name1 = function name2(foo)" preferring name1
    var name = matches.name || '';
    var args = matches.args;

    return [name, args, null];
};

CoffeeParser.prototype.parse_var = function(line) {
    //   var foo = blah,
    //       foo = blah;
    //   baz.foo = blah;
    //   baz = {
    //        foo : blah
    //   }
    var regex = xregexp(
        '(?P<name>' + this.settings.varIdentifier + ')\\s*[=:]\\s*(?P<val>.*?)(?:[;,]|$)'
        );
    var matches = xregexp.exec(line, regex);
    if(matches === null)
        return null;

    return [matches.name, matches.val.trim()];
};

CoffeeParser.prototype.guess_type_from_value = function(val) {
    var lowerPrimitives = this.editor_settings.lower_case_primitives || false;
    if(this.is_numeric(val))
        return (lowerPrimitives ? 'number' : 'Number');
    if((val[0] == '"') || (val[0] == '\''))
        return (lowerPrimitives ? 'string' : 'String');
    if(val[0] == '[')
        return 'Array';
    if(val[0] == '{')
        return 'Object';
    if((val == 'true') || (val == 'false'))
        return (lowerPrimitives ? 'boolean' : 'Boolean');
    var regex = new RegExp('RegExp\\b|\\\/[^\\/]');
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

module.exports = CoffeeParser;
