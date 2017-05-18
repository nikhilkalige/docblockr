var DocsParser = require("../docsparser");
var xregexp = require('../xregexp').XRegExp;
var escape = require('../utils').escape;
var util = require('util');

function JavaParser(settings) {
    DocsParser.call(this, settings);
}

JavaParser.prototype = Object.create(DocsParser.prototype);

JavaParser.prototype.setup_settings = function() {
    var identifier = '[a-zA-Z_$][a-zA-Z_$0-9]*';
    this.settings = {
        'curlyTypes': false,
        'typeInfo': false,
        'typeTag': 'type',
        'varIdentifier': identifier,
        'fnIdentifier':  identifier,
        'fnOpener': identifier + '(?:\\s+' + identifier + ')?\\s*\\(',
        'commentCloser': ' */',
        'bool': 'Boolean',
        'function': 'Function'
    };
};

JavaParser.prototype.parse_function = function(line) {
    line = line.trim();
    var regex = xregexp(
        // Modifiers
        '(?:(public|protected|private|static|abstract|final|transient|synchronized|native|strictfp)\\s+)*' +
        // Return value
        '(?P<retval>[a-zA-Z_$][\\<\\>\\., a-zA-Z_$0-9\\[\\]]+)\\s+' +
        // Method name
        '(?P<name>' + this.settings.fnIdentifier + ')\\s*' +
        // Params
        '\\((?P<args>.*?)\\)\\s*' +
        // # Throws ,
        '(?:throws\\s*(?P<throwed>[a-zA-Z_$0-9\\.,\\s]*))?'
        );

    var matches = xregexp.exec(line, regex);
    if(matches === null)
        return null;

    var name = matches.name || '';
    var retval = matches.retval || null;

    var arg_throws;
    if (matches.throwed) {
        arg_throws = matches.throwed.trim().split(/\s*,\s*/);
    } else {
        arg_throws = null;
    }

    var args;
    if (matches.args) {
        args = matches.args.trim();
    } else {
        args = null;
    }

    return [name, args, retval, arg_throws];
};

JavaParser.prototype.parse_var = function(line) {
    return null;
};

JavaParser.prototype.guess_type_from_value = function(val) {
    return null;
};

JavaParser.prototype.format_function = function(name, args, retval, throws_args, options) {
    if (typeof options === 'undefined') {
        options = {};
    }

    var out = DocsParser.prototype.format_function.call(this, name, args, retval, options);

    if(throws_args) {
        throws_args.forEach(function (type) {
            out.push(util.format('@throws %s ${1:[description]}', escape(type)));
        });
    }

    return out;
};

JavaParser.prototype.get_function_return_type = function(name, retval) {
    if(retval === 'void')
        return null;
    else
        return retval;
};

JavaParser.prototype.get_definition = function(editor, pos, read_line) {
    var maxLines = 25;  // don't go further than this

    var definition = '';
    var open_curly_annotation = false;
    var open_paren_annotation = false;

    var i, len;
    for(i=0; i < maxLines; i++) {
        var line = read_line(editor, pos);
        if(line == null)
            break;

        pos.row+= 1;
        // Move past empty lines
        if(line.search(/^\s*$/) > -1)
            continue;

        // strip comments
        line = line.replace(/\/\/.*/, '');
        line = line.replace(/\/\*.*\*\//, '');
        if(definition === '') {
            // Must check here for function opener on same line as annotation
            if(this.settings.fnOpener && (line.search(RegExp(this.settings.fnOpener)) > -1)) {

            }
            // Handle Annotations
            else if(line.search(/^\s*@/) > -1) {
                if((line.search('{') > -1) && line.search('}') === -1)
                    open_curly_annotation = true;
                if((line.search('\\(') > -1) && line.search('\\)') === -1)
                    open_paren_annotation = true;
                continue;
            }
            else if(open_curly_annotation) {
                if(line.search('}') > -1)
                    open_curly_annotation = false;
                continue;
            }
            else if(open_paren_annotation) {
                if(line.search('\\)') > -1)
                    open_paren_annotation = false;
            }
            else if(line.search(/^\s*$/) > -1)
                continue;
            // Check for function
            else if(!(this.settings.fnOpener) || line.search(RegExp(this.settings.fnOpener)) === -1) {
                definition = line;
                break;
            }
        }
        definition+= line;
        if((line.indexOf(';') > -1) || (line.indexOf('{') > -1)) {
            var regex = new RegExp('\\s*[;{]\\s*$', 'g');
            definition = definition.replace(regex, '');
            break;
        }
    }
    return definition;
};

module.exports = JavaParser;
