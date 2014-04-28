'use strict';

var util = require('util');

var escape = function(str) {
    return str.replace('$', '\$').replace('{', '\{').replace('}', '\}')
}

function DocsParser(settings) {
    this.editor_settings = settings;
    this.setup_settings();
    this.name_override = null;
}

DocsParser.prototype.init = function(viewSettings) {
    this.viewSettings = viewSettings;
    this.setupSettings();
    this.nameOverride = null;
};

DocsParser.prototype.is_existing_comment = function(line) {
    return ((line.search(/^\s*\*/) >=0) ? true : false);
};

DocsParser.prototype.is_numeric = function(val) {
    if(!isNaN(val))
        return true;

    return false;
}

DocsParser.prototype.set_name_override = function(name) {
    // overrides the description of the function - used instead of parsed description
    this.name_override = name;
};

DocsParser.prototype.get_name_override = function(){
    return this.name_override;
};

DocsParser.prototype.parse = function(line) {
    if(this.editor_settings.simple_mode === true) {
        return null;
    }
    var out = this.parse_function(line);  // (name, args, retval, options)
    if (out) {
        return this.format_function.apply(this, out);
    }
    out = this.parse_var(line);
    if (out) {
        return this.format_var(out.name, out.val);
    }
    return null;
};

DocsParser.prototype.format_var = function(name, val, valType) {
    valType = typeof valType !== 'undefined' ? valType : null;
    var out = [];
    var brace_open, brace_close, temp;
    if(this.settings.curlyTypes) {
        brace_open = '{';
        brace_close = '}';
    }
    else {
        brace_open = brace_close = '';
    }
    if (!valType) {
        if(!val || (val === '')) {  //quick short circuit
            valType = '[type]';
        }
        else {
            valType = this.guess_type_from_value(val) || this.guess_type_from_name(name) || '[type]';
        }
    }
    if(this.inline) {
        temp = util.format('@%s %s${1:%s}%s ${1:[description]}',
                                        this.settings.typeTag, brace_open, valType, brace_close);
        out.push(temp);
    }
    else {
        temp = util.format('${1:[%s description]}', escape(name));
        out.push(temp);
        temp = util.format('@%s %s${1:%s}%s',
                                this.settings.typeTag, brace_open, valType, brace_close);
        out.push(temp);
    }
    return out;
};

DocsParser.prototype.get_type_info = function(argType, argName) {
    var typeInfo = '';
    var brace_open, brace_close;
    if(this.settings.curlyTypes) {
        brace_open = '{';
        brace_close = '}';
    }
    else {
        brace_open = brace_close = '';
    }
    if(this.settings.typeInfo) {
        typeInfo = util.format('%s${1:%s}%s ' , brace_open,
                                escape(argType || this.guess_type_from_name(argName) || '[type]'),
                                brace_close
        );
    }
    return typeInfo;
};

DocsParser.prototype.format_function = function(name, args, retval, options) {
    options = (typeof options !== 'undefined') ? options : {};
    var out = [];
    var i, len, format_str;
    if(options.hasOwnProperty('as_setter')) {
        out.push('@private');
        return out;
    }
    var extra_tag_after = this.editor_settings.extra_tags_go_after || false;

    var description = this.get_name_override() || ('['+ escape(name) + (name ? ' ': '') + 'description]');
    out.push('${1:' + description + '}');

    if (this.editor_settings.autoadd_method_tag) {
        out.push('@method '+ escape(name));
    }

    if(!extra_tag_after)
        this.add_extra_tags(out);

    // if there are arguments, add a @param for each
    if(args) {
        // remove comments inside the argument list.
        args = args.replace(/\/\*.*?\*\//,'');
        var parsed_args = this.parse_args(args);
        for (i = 0; len = parsed_args.length,i < len; i++) {
            var arg_type = parsed_args[i][0];
            var arg_name = parsed_args[i][1];

            type_info = this.get_type_info(arg_type, arg_name);
            format_str = '@param %s%s';
            //var str = '@param ' + type_info + escape(arg_name);
            if(this.editor_settings.param_description)
                //str+= ' ${1:[description]}';
                format_str += ' ${1:[description]}';
            //out.push(str);
            out.push(util.format(format_str, type_info, escape(arg_name)));
        }
    }

    // return value type might be already available in some languages but
    // even then ask language specific parser if it wants it listed
    var ret_type = this.get_function_return_type(name, retval);
    if(ret_type !== null) {
        var type_info = '';
        if(this.settings.typeInfo)
            //type_info = ' ' + (this.settings.curlyTypes ? '{' : '') + '${1:' + (ret_type || '[type]') + (this.settings.curlyTypes ? '}' : '');
            type_info = util.format(' %s${1:%s}%s', (this.settings.curlyTypes ? '{' : ''), 
                                                    (ret_type || '[type]'), 
                                                    (this.settings.curlyTypes ? '}' : '')
                                    );

        var format_args = [
            (this.editor_settings.return_tag || '@return'),
            type_info
        ];
        
        if (this.editor_settings.return_description) {
            format_str = '%s%s %s${1:[description]}';
            var third_arg = '';

            // the extra space here is so that the description will align with the param description
            if(args && (this.editor_settings.align_tags == 'deep')) {
                if(!this.editor_settings.per_section_indent)
                    third_arg = ' ';
            }

            format_args.push(third_arg);
        }
        else
            format_str = '%s%s';
        
        // TODO
        //out.push(util.format(format_str, format_args));
        format_args.forEach(function(element) {
            format_str = util.format(format_str, element);
        });
        out.push(format_str);
    }
    var matching_names = this.get_matching_notations(name);
    for (i = 0; len = matching_names.length,i < len; i++) {
        var notation = matching_names[i];
        if(notation.indexOf('tags') > -1)
            out.concat(notation.args);
    }

    if(extra_tag_after)
        this.add_extra_tags(out);

    return out;
};

DocsParser.prototype.get_function_return_type = function(name, retval) {
    // returns None for no return type. False meaning unknown, or a string
    if(name.search(/[A-Z]/) > -1)
        return null;  // no return, but should add a class

    if(name.search(/[$_]?(?:set|add)($|[A-Z_])/) > -1)
        return null;     // setter/mutator, no return

    if(name.search(/[$_]?(?:is|has)($|[A-Z_])/) > -1)  //functions starting with 'is' or 'has'
        return this.settings.bool;

    return (this.guess_type_from_name(name) || false);
};

DocsParser.prototype.parse_args = function(args) {
    /*
    an array of tuples, the first being the best guess at the type, the second being the name
    */
    var out = [];
    if(!args)
        return out;
    // the current token
    var current = '';
    // characters which open a section inside which commas are not separators between different arguments
    var open_quotes  = '"\'<(';
    // characters which close the the section. The position of the character here should match the opening
    // indicator in `openQuotes`
    var close_quotes = '"\'>)';
    var matching_quote = '';
    var inside_quotes = false;
    var next_is_literal = false;
    var blocks = [];

    var i, len;
    for (i = 0; len = args.length,i < len; i++) {
        var character = args.charAt(i);
        if(next_is_literal) {// previous char was a \
            current+= character;
            next_is_literal = false;
        }
        else if(character == '\\') {
            next_is_literal = true;
        }
        else if(inside_quotes) {
            current+= character;
            if(character === matching_quote)
                inside_quotes = false;
        }
        else {
            if(character == ',') {
                blocks.push(current.trim());
                current = '';
            }
            else {
                current+= character;
                var quote_index = open_quotes.indexOf(character);
                if(quote_index > -1) {
                    matching_quote = close_quotes[quote_index];
                    inside_quotes = true;
                }
            }
        }
    }
    blocks.push(current.trim());

    for (i = 0; len = blocks.length,i < len; i++) {
        var arg = blocks[i];
        out.push([this.get_arg_type(arg), this.get_arg_name(arg)]);
    }
    return out;
};

DocsParser.prototype.get_arg_type = function(arg) {
    return null;
};

DocsParser.prototype.get_arg_name = function(arg) {
    return arg;
};

DocsParser.prototype.add_extra_tags = function(out) {
    var extra_tags = this.editor_settings.extra_tags || [];
    if (extra_tags.length > 0)
        out.concat(extra_tags);
};

DocsParser.prototype.guess_type_from_name = function(name) {
    var matches = this.get_matching_notations(name);
    if(matches.length > 0) {
        var rule = matches[0];
        if(rule.indexOf('type') > -1)
            return (this.settings.indexOf(rule.type) > -1) ? this.settings.rule.type : rule.type;
    }
    if(name.search('(?:is|has)[A-Z_]') > -1)
        return this.settings.bool;

    if(name.search('^(?:cb|callback|done|next|fn)$') > -1)
        return this.settings.function;
    
    return false;
};

DocsParser.prototype.get_matching_notations = function(name) {
    var check_match = function(rule) {
        if(rule.indexOf('prefix') > -1) {
            //TODO :escape prefix
            var regex = new RegExp(rule.prefix);
            if(rule.prefix.search('.*[a-z]') > -1)
                regex = new RegExp(regex.source + (/(?:[A-Z_]|$)/).source);
            return regex.exec(name);
        }
        else if(rule.indexOf('regex') > -1)
            return rule.regex.exec(name);
    };
    
    return (this.editor_settings.notation_map || []).filter(check_match);
};

DocsParser.prototype.get_definition = function(editor, pos, read_line) {
    //TODO:
    // get a relevant definition starting at the given point
    // returns string
    var maxLines = 25;  //# don't go further than this
    var openBrackets = 0;
    var definition = '';

    // make pos writable
    //pos = pos.copy();

    // count the number of open parentheses
    var count_brackets = function(total, bracket) {
        if(bracket == '(')
           return total + 1;
        else
            return total - 1;
    };

    for(var i=0; i < maxLines; i++) {
        var line = read_line(editor, pos);
        if(line == null)
            break;

        //pos += (line.length + 1);
        pos.row+= 1;
        // strip comments
        line = line.replace(/\/\/.*/, '');
        line = line.replace(/\/\*.*\*\//, '');

        var searchForBrackets = line;
        var opener;
        // on the first line, only start looking from *after* the actual function starts. This is
        // needed for cases like this:
        // (function (foo, bar) { ... })
        if(definition === '') {
            if(this.settings.fnOpener) {
                opener = this.settings.fnOpener.exec(line);
            }
            else {
                opener = false;
            }
            if((opener >= 0) && (opener != null)){
                // ignore everything before the function opener
                searchForBrackets = line.slice(opener.index);
            }
        }
        var regex = new RegExp('[()]', 'g');
        var Brackets = [];
        var match;
        while((match = regex.exec(searchForBrackets)) !== null) {
            Brackets.push(match); 
        }
        openBrackets = Brackets.reduce(count_brackets, openBrackets);

        definition += line;
        if(openBrackets === 0)
            break;
    }
    return definition;
};

function JsParser(settings) {
    //this.setup_settings();
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
    // grab the name out of "name1 = function name2(foo)" preferring name1
    var name = matches[1] || matches[2] || '';
    var args = matches[3];
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
    return {
        name: matches[1], 
        val: matches[2].trim()
    };
};

JsParser.prototype.guess_type_from_value = function(val) {
    var lower_primitives = this.editor_settings.lower_case_primitives || false;
    var short_primitives = this.editor_settings.short_primitives || false;

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
    if(val[0] == '[') {
        return 'Array';
    }
    if(val[0] == '{') {
        return 'Object';
    }
    if((val == 'true') || (val == 'false')) {
        var ret_val = (short_primitives ? 'Bool' : 'Boolean');
        return (lower_primitives ? ret_val : capitalize(ret_val));
    }
    var regex = new RegExp('RegExp\\b|\\\/[^\\/]');
    if(regex.test(val)) {
        return 'RegExp';
    }
    if(val.slice(0, 4) == 'new ') {
        regex = new RegExp('new (' + this.settings.fnIdentifier + ')');
        var matches = regex.exec(val);
        return (matches[0] && matches[1]) || null;
    }
    return null;
};

function CppParser(settings) {
    //this.setup_settings();
    // call parent constructor
    DocsParser.call(this, settings);
}

CppParser.prototype = Object.create(DocsParser.prototype);

CppParser.prototype.setup_settings = function() {
    var name_token = '[a-zA-Z_][a-zA-Z0-9_]*';
    var identifier = util.format('(%s)(::%s)?', name_token, name_token);
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
    var regex = new RegExp(
        '(' + this.settings.varIdentifier + ')[&*\s]+' +
        '(' + this.settings.fnIdentifier + ');?' +
        // void fnName
        // (arg1, arg2)
        '\s*\(\s*(.*)\)'
    );

    var matches = regex.exec(line);
    if(matches === null) {
        return null;
    }

    return [matches[2], matches[3], matches[1]];
};

CppParser.prototype.parse_args = function(args) {
    if(args.trim() == 'void')
        return [];
    return DocsParser.parse_args.call(this, args);
    //return super(JsdocsCPP, self).parseArgs(args)
};

CppParser.prototype.get_arg_type = function(arg) {
    return null;
};

CppParser.prototype.get_arg_name = function(arg) {
    var regex = new RegExp(this.settings.varIdentifier + '(?:\s*=.*)?$');
    var matches = regex.exec(arg);
    return matches[1];
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

function RustParser(settings) {
    DocsParser.call(this, settings);
}

RustParser.prototype = Object.create(DocsParser.prototype);

RustParser.prototype.setup_settings = function() {
    this.settings = {
        'curlyTypes': false,
        'typeInfo': false,
        'typeTag': false,
        'varIdentifier': '.*',
        'fnIdentifier':  '.*',
        'fnOpener': /^\s*fn/,
        'commentCloser': ' */',
        'bool': 'Boolean',
        'function': 'Function'
    };
};

RustParser.prototype.parse_function = function(line) {
    var regex = /\s*fn\s+(\S+)/;
    var matches = regex.exec(line);
    if(matches === null)
        return null;
    var name = [].join(matches[1]);
    return [ name, []];
};

RustParser.prototype.format_function = function(name, args) {
        return name;
};

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
    var regex = new RegExp(
        'function\\s+&?(?:\\s+)?' + 
        '(' + this.settings.fnIdentifier + ')' + 
        // function fnName
        // (arg1, arg2)
        '\\s*\\(\\s*(.*)\)'
        );

    var matches = regex.exec(line);
    if(matches === null)
        return null;

    return [matches[1], matches[2], null];
};

PhpParser.prototype.get_arg_type = function(arg) {
    // function add($x, $y = 1)
    var regex = new RegExp(
        '(' + this.settings.varIdentifier + ')\\s*=\\s*(.*)'
        );
    
    var matches = regex.exec(arg);
    if(matches !== null)
        return this.guess_type_from_value(matches[2]);

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
    var regex = new RegExp(
        '(' + this.settings.varIdentifier + ')\\s*=>?\\s*(.*?)(?:[;,]|$)'
        );
    var matches = regex.exec(line);
    if(matches !== null)
        return [matches[1], matches[2].trim()];

    regex = new RegExp(
        '\\b(?:var|public|private|protected|static)\\s+(' + this.settings.varIdentifier + ')'
        );
    matches = regex.exec(line);
    if(matches !== null)
        return [matches[1], null];

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
    return DocsParser.get_function_return_type.call(this, name, retval);
};

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
    var regex = new RegExp(
        // fnName = function,  fnName : function
        '(?:(' + this.settings.varIdentifier + ')\\s*[:=]\\s*)?' +
        '(?:\\(([^()]*?)\\))?\\s*([=-]>)'
        );
    var matches = regex.exec(line);
    if(matches === null)
        return null;

    // grab the name out of "name1 = function name2(foo)" preferring name1
    var name = matches[1] || '';
    var args = matches[2];

    return [name, args, null];
};

CoffeeParser.prototype.parse_var = function(line) {
    //   var foo = blah,
    //       foo = blah;
    //   baz.foo = blah;
    //   baz = {
    //        foo : blah
    //   }
    var regex = new RegExp(
        '(' + self.settings.varIdentifier + ')\\s*[=:]\\s*(.*?)(?:[;,]|$)'
        );
    var matches = regex.exec(line);
    if(matches === null)
        return null;

    return [matches[1], matches[2].trim()];
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

module.exports = {
    JsParser: JsParser,
    CppParser: CppParser,
    RustParser: RustParser,
    PhpParser: PhpParser,
    CoffeeParser: CoffeeParser,
    escape: escape,
};
