var util = require('util');
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
    // single quotes indicate what will be matched in each line
    var preFunction = '^' +
        // '  'var foo = function bar (baz, quaz) {}
        '\\s*' +
        '(?:' +
            // 'return' foo = function bar (baz, quaz) {}
            'return\\s+' +
            '|' +
            // 'export default 'var foo = function bar (baz, quaz) {}
            '(?:export\\s+(?:default\\s+)?)?' +
            //  export default 'var 'foo = function bar (baz, quaz) {}
            '(?:(?:var|let|const)\\s+)?' +
        ')?' +
        '(?:' +
            //   var 'bar.prototype.'foo = function bar (baz, quaz) {}
            '(?:[a-zA-Z_$][a-zA-Z_$0-9.]*\\.)?' +
            //   var 'foo = 'function bar (baz, quaz) {}
            '(?P<name1>' + this.settings.varIdentifier + ')\\s*[:=]\\s*' +
        ')?';

    var functionRegex = xregexp(
        preFunction +
        // modifiers: static, async
        '(?:\\bstatic\\s+)?(?P<promise>\\basync\\s+)?' +
        //   var foo = 'function 'bar (baz, quaz) {}
        '(?:function(:?(?P<generator>\\s*\\*)|\\s)?|get\\s|set\\s)\\s*' +
        //   var foo = function 'bar '(baz, quaz) {}
        '(?P<name2>' + this.settings.fnIdentifier + ')?\\s*' +
        //   var foo = function bar '(baz, quaz)' {}
        '\\(\\s*(?P<args>.*?)\\)'
    );

    var arrowFunctionRegex = xregexp(
        preFunction +
        '(?P<promise>async\\s+)?' +
        '(?:'+
            //   var foo = 'bar' => {}
            '(?P<arg>' + this.settings.varIdentifier + ')' +
            '|' +
            //   var foo = '(bar, baz)' => {}
            '\\(\\s*(?P<args>.*?)\\)' +
        ')\\s*' +
        //   var foo = bar '=>' {}
        '=>\\s*'
    );


    var functionMatches = xregexp.exec(line, functionRegex);
    var arrowFunctionMatches = xregexp.exec(line, arrowFunctionRegex);
    var matches = functionMatches || arrowFunctionMatches;

    if(matches === null) {
        return null;
    }
    // grab the name out of "name1 = function name2(foo)" preferring name1
    var name = matches.name1 || matches.name2 || '';
    var args = matches.args || matches.arg || null;

    // check for async method to set retval to promise
    var retval = null;
    if (matches.promise) {
        retval = 'Promise';
    } else if (matches.generator) {
        retval = 'Generator';
    }

    return [name, args, retval];
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

JsParser.prototype.parse_arg = function(arg) {

    var regex = xregexp(
        '(?P<name>' + this.settings.varIdentifier + ')(\\s*=\\s*(?P<value>.*))?'
    );

    return xregexp.exec(arg, regex);
};

JsParser.prototype.get_arg_type = function(arg) {

    var matches = this.parse_arg(arg);

    if(matches && matches.value) {
        return this.guess_type_from_value(matches.value);
    }

    return null;
};

JsParser.prototype.get_arg_name = function(arg) {

    var matches = this.parse_arg(arg);

    if (matches.value) {
      return util.format('[%s=%s]', matches.name, matches.value);
    }

    return matches.name;
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
    var regex = new RegExp('^RegExp|^\\/[^/*].*\\/$');
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

JsParser.prototype.get_function_return_type = function(name, retval) {
    if(retval) {
      return retval;
    }
    return DocsParser.prototype.get_function_return_type.call(this, name, retval);
};

module.exports = JsParser;
