'use strict';

var util = require('util');
var escape = require('./utils').escape;

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
};

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
        return this.format_var.apply(this, out);
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

    if (this.editor_settings.auto_add_method_tag) {
        out.push('@method '+ escape(name));
    }

    if(!extra_tag_after)
        out = this.add_extra_tags(out);

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
        out = this.add_extra_tags(out);

    return out;
};

DocsParser.prototype.get_function_return_type = function(name, retval) {
    // returns None for no return type. False meaning unknown, or a string
    if(/^[A-Z]/.test(name))
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
        out = out.concat(extra_tags);
    return out;
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
                opener = RegExp(this.settings.fnOpener).exec(line);
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

module.exports = DocsParser;
