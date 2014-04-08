/**
 *      We will be creating a basic parser for function and returning the doc string
 */
'use strict';
//module.exports.dockblockr = function(data, lang) {
//   console.log(data)
//}


function DocsParser(settings) {
    this.settings = settings;
    //this.setup_settings()
    //this.name_override = None
};
/*
DocsParser.prototype.is_existing_comment = function(line) {
    return line.search('^\\s*\\*')
};
*/
function JsParser() {
    this.name = "nik";
    this.setup_settings();
}


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
        'fnOpener': /function(?:\s+' + identifier + r')?\s*\(/,
        'commentCloser': ' */',
        'bool': 'Boolean',
        'function': 'Function'
    };
};

JsParser.prototype.parse_function = function(line) {
    // (?:([a-zA-Z_$][a-zA-Z_$0-9]*)\\s*[:=]\\s*)?function(?:\\s+([a-zA-Z_$][a-zA-Z_$0-9]*))?\\s*\\(\\s*(.*)\\)
    var regex =  new RegExp(
        //   fnName = function,  fnName : function
        '(?:(' + this.settings.varIdentifier + ')\\s*[:=]\\s*)?' +
        'function' +
        // function fnName
        '(?:\\s+(' + this.settings.fnIdentifier + '))?' +
        // (arg1, arg2)
        '\\s*\\(\\s*(.*)\\)'
    );

    var matches = regex.exec(line);
    if(matches === null) {
        return null;
    }
    for(var i=0;i < matches.length; i++) {
        console.log(i+ ':' + matches[i]);
    }
    // grab the name out of "name1 = function name2(foo)" preferring name1
    var name = matches[1] || matches[2] || '';
    var args = matches[3];
    console.log(name);
    return [name, args, null];
};

JsParser.prototype.parse_var = function(line) {
        //   var foo = blah,
        //       foo = blah;
        //   baz.foo = blah;
        //   baz = {
        //        foo : blah
        //   }
    var regex = new RegExp('(' + this.settings.varIdentifier + ')\\s*[=:]\\s*(.*?)(?:[;,]|$)');
    var matches = regex.exec(line);
    if(matches === null) {
        return null;
    }
    // variable name, variable value
    return [matches[1], matches[2].trim()];
};

JsParser.prototype.guess_type_from_value = function(val) {
    //lowerPrimitives = self.viewSettings.get('jsdocs_lower_case_primitives') or False
    //shortPrimitives = self.viewSettings.get('jsdocs_short_primitives') or False
    var var_type = typeof(val);
    if((var_type === 'string') || (var_type === 'number')) {
        return var_type;
    }
    if(val[0] == '[') {
        return 'Array';
    }
    if(val[0] == '{') {
        return 'Object';
    }
    if((val === true) || (val === false)) {
        return 'Boolean';
    }
    var regex = new RegExp('RegExp\\b|\\\/[^\\/]');
    if(regex.test(val)) {
        return 'RegExp';
    }
    if(val.slice(0, 4) == 'new ') {
        var regex = new RegExp('new (' + this.settings.fnIdentifier + ')');
        var matches = regex.exec(val);
        return (matches[0] && matches[1]) || null;
    }
    return null;
};




module.exports.parser = new JsParser();
