/**
 *      We will be creating a basic parser for function and returning the doc string
 */
'use strict';
//module.exports.dockblockr = function(data, lang) {
//   console.log(data)
//}
var util = require('util');

var escape = function(str) {
    return str.replace('$', '\$').replace('{', '\{').replace('}', '\}')
}

var read_line = function(editor, point) {
    // TODO: no longer works
    if(point >= editor.getText().length)
        return;
    return editor.lineForBufferRow(point.row);
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

DocsParser.prototype.set_name_override = function(name) {
    // overrides the description of the function - used instead of parsed description
    this.name_override = name;
};
/*
DocsParser.prototype.get_name_override = function(){
    return this.name_override;
};
*/
DocsParser.prototype.parse = function(line) {
    if(this.editor_settings.simple_mode === true) {
        return null;
    }
    var out = this.parse_function(line);  // (name, args, retval, options)
    if (out) {
        return this.format_function(out);
    }
    out = this.parse_var(line);
    if (out) {
        return this.format_var(out);
    }
    return null;
};
/*
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
*//*
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
*//*
DocsParser.prototype.formatFunction = function(name, args, retval, options) {
    options = typeof options !== 'undefined' ? options : {};
    var out = [];
    if('as_setter' in options) {
        out.append('@private');
        return out;
    }
    var extraTagAfter = this.viewSettings.get('jsdocs_extra_tags_go_after') || false;

    var description = this.getNameOverride() || 
        ('['+ this.escape(name) + (name ? ' ': '') + 'description]');
    out.append('${1:' + description + '}');

    if (this.viewSettings.get('jsdocs_autoadd_method_tag') is true) {
        out.append('@method '+ this.escape(name));
    }

    if(!extraTagAfter)
        this.addExtraTags(out);

    // if there are arguments, add a @param for each
    if(args) {
        // remove comments inside the argument list.
        args = re.sub("/\*.*?\*/

            /*", '', args);
        for argType, argName in this.parseArgs(args):
            typeInfo = this.getTypeInfo(argType, argName)

            format_str = "@param %s%s"
            if (this.viewSettings.get('jsdocs_param_description')):
                format_str += " ${1:[description]}"

            out.append(format_str % (
                typeInfo,
                escape(argName)
            ))
    }

    # return value type might be already available in some languages but
    # even then ask language specific parser if it wants it listed
    retType = this.getFunctionReturnType(name, retval)
    if retType is not None:
        typeInfo = ''
        if this.settings['typeInfo']:
            typeInfo = ' %s${1:%s}%s' % (
                "{" if this.settings['curlyTypes'] else "",
                retType or "[type]",
                "}" if this.settings['curlyTypes'] else ""
            )
        format_args = [
            this.viewSettings.get('jsdocs_return_tag') or '@return',
            typeInfo
        ]

        if (this.viewSettings.get('jsdocs_return_description')):
            format_str = "%s%s %s${1:[description]}"
            third_arg = ""

            # the extra space here is so that the description will align with the param description
            if args and this.viewSettings.get('jsdocs_align_tags') == 'deep':
                if not this.viewSettings.get('jsdocs_per_section_indent'):
                    third_arg = " "

            format_args.append(third_arg)
        else:
            format_str = "%s%s"

        out.append(format_str % tuple(format_args))

    for notation in this.getMatchingNotations(name):
        if 'tags' in notation:
            out.extend(notation['tags'])

    if extraTagAfter:
        this.addExtraTags(out)

    return out
};
*//*
DocsParser.prototype.get_function_return_type = function(name, retval) {
    """ returns None for no return type. False meaning unknown, or a string """
    if(name.search(/[A-Z]/))
        return null;  // no return, but should add a class

    if (name.search(/[$_]?(?:set|add)($|[A-Z_])/))
        return null;     // setter/mutator, no return

    if name.match(/[$_]?(?:is|has)($|[A-Z_])/)  //functions starting with 'is' or 'has'
        return this.settings.bool;

    return (this.guess_type_from_name(name) || false);
};
*//*
DocsParser.prototype.parse_args = function(args) {
    """
    an array of tuples, the first being the best guess at the type, the second being the name
    """
    out = []

    if not args:
        return out

    # the current token
    current = ''

    # characters which open a section inside which commas are not separators between different arguments
    openQuotes  = '"\'<('
    # characters which close the the section. The position of the character here should match the opening
    # indicator in `openQuotes`
    closeQuotes = '"\'>)'

    matchingQuote = ''
    insideQuotes = False
    nextIsLiteral = False
    blocks = []

    for char in args:
        if nextIsLiteral:  # previous char was a \
            current += char
            nextIsLiteral = False
        elif char == '\\':
            nextIsLiteral = True
        elif insideQuotes:
            current += char
            if char == matchingQuote:
                insideQuotes = False
        else:
            if char == ',':
                blocks.append(current.strip())
                current = ''
            else:
                current += char
                quoteIndex = openQuotes.find(char)
                if quoteIndex > -1:
                    matchingQuote = closeQuotes[quoteIndex]
                    insideQuotes = True

    blocks.append(current.strip())

    for arg in blocks:
        out.append((this.getArgType(arg), this.getArgName(arg)))
    return out
}
*//*
DocsParser.prototype.get_arg_type = function(arg) {
    return null;
}

DocsParser.prototype.get_arg_name = function(arg) {
    return arg;
}

DocsParser.prototype.add_extra_tags = function(out) {
    extraTags = this.viewSettings.get('jsdocs_extra_tags', [])
    if (extraTags.length > 0)
        out.concat(extraTags);
}

DocsParser.prototype.guess_type_from_name = function(name) {
    matches = this.get_matching_notations(name);
    if(matches.length) {
        rule = matches[0];
        if(rule.indexOf('type') >= 0)
            return (this.settings[rule['type']] if rule['type'] in this.settings else rule['type']
    }
    if (name.search("(?:is|has)[A-Z_]"))
        return this.settings.bool;

    if(name.search("^(?:cb|callback|done|next|fn)$"))
        return this.settings.function;
    return false;
}

DocsParser.prototype.get_matching_notations = function(name) {
    checkMatch = function(rule) {
        if(rule.indexOf('prefix') >= 0) {
            var regex = new RegExp(rule['prefix']);
            if(rule['prefix'].search('.*[a-z]')) {
                regex = new RegExp(regex.source + (/(?:[A-Z_]|$)/).source);
            return name.search(regex);
        }
        else if(rule.indexOf('regex') >= 0)
            return name.search(rule['regex']);
    }
    //TODO:
    //for
    //return list(filter(checkMatch, this.viewSettings.get('jsdocs_notation_map', [])))
}
*/
    //pos = pos.copy();
DocsParser.prototype.get_definition = function(editor, pos) {
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
}

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
    for(var i=0;i < matches.length; i++) {
        console.log(i+ ':' + matches[i]);
    }
    // grab the name out of "name1 = function name2(foo)" preferring name1
    var name = matches[1] || matches[2] || '';
    var args = matches[3];
    console.log(name);
    return [name, args, null];
};
/*
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
    //lowerPrimitives = this.viewSettings.get('jsdocs_lower_case_primitives') or False
    //shortPrimitives = this.viewSettings.get('jsdocs_short_primitives') or False
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
*/

module.exports = {
    JsParser: JsParser,
};
