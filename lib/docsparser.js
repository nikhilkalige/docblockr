'use strict';

const util = require('util');
const escape = require('./utils').escape;

function DocsParser (settings) {
  this.editor_settings = settings;
  this.setup_settings();
  this.name_override = null;
}

DocsParser.prototype.init = function (viewSettings) {
  this.viewSettings = viewSettings;
  this.setupSettings();
  this.nameOverride = null;
};

DocsParser.prototype.is_existing_comment = function (line) {
  return /^\s*\*/.test(line);
};

DocsParser.prototype.is_numeric = function (val) {
  return !isNaN(val);
};

DocsParser.prototype.set_name_override = function (name) {
  // overrides the description of the function - used instead of parsed description
  this.name_override = name;
};

DocsParser.prototype.get_name_override = function () {
  return this.name_override;
};

DocsParser.prototype.format_class = function (name) {
  const out = [];
  const temp = `\${1:[${escape(name)} description]}`;
  out.push(temp);
  return out;
};

DocsParser.prototype.parse = function (line) {
  if (this.editor_settings.simple_mode || !line) {
    return null;
  }

  let out;
  out = this.parse_class && this.parse_class(line); // (name, extends)
  if (out) {
    return this.format_class.apply(this, out);
  }
  out = this.parse_function(line); // (name, args, retval, options)
  if (out) {
    return this.format_function.apply(this, out);
  }
  out = this.parse_var(line); // (name, val, valType)
  if (out) {
    return this.format_var.apply(this, out);
  }
  return null;
};

DocsParser.prototype.format_var = function (name, val, valType) {
  valType = typeof valType !== 'undefined' ? valType : null;
  const out = [];
  let braceOpen, braceClose, temp;
  if (this.settings.curlyTypes) {
    braceOpen = '{';
    braceClose = '}';
  } else {
    braceOpen = braceClose = '';
  }
  if (!valType) {
    if (!val || (val === '')) { // quick short circuit
      valType = '[type]';
    } else {
      valType = this.guess_type_from_value(val) || this.guess_type_from_name(name) || '[type]';
    }
  }
  if (this.inline) {
    temp = `@${this.settings.typeTag} ${braceOpen}\${1:${valType}}${braceClose} \${1:[description]}`;
    out.push(temp);
  } else {
    temp = `\${1:[${escape(name)} description]}`;
    out.push(temp);

    if (this.settings.typeInfo) {
      temp = `@${this.settings.typeTag} ${braceOpen}\${1:${valType}}${braceClose}`;
      out.push(temp);
    }
  }
  return out;
};

DocsParser.prototype.get_typeInfo = function (argType, argName) {
  if (!this.settings.typeInfo) {
    return '';
  }

  let braceOpen, braceClose;
  if (this.settings.curlyTypes) {
    braceOpen = '{';
    braceClose = '}';
  } else {
    braceOpen = braceClose = '';
  }

  if (!argType) {
    argType = this.guess_type_from_name(argName) || '[type]';
  }
  if (!argName) {
    argName = '[name]';
  }

  return `${braceOpen}\${1:${escape(argType)}}${braceClose} `;
};

DocsParser.prototype.format_function = function (name, args, retval, options) {
  options = (typeof options !== 'undefined') ? options : {};
  let out = [];
  let i, formatStr;
  if (Object.prototype.hasOwnProperty.call(options, 'as_setter')) {
    out.push('@private');
    return out;
  }
  const extraTagAfter = this.editor_settings.extraTags_go_after || false;

  const description = this.get_name_override() || ('[' + escape(name) + (name ? ' ' : '') + 'description]');
  out.push('${1:' + description + '}');

  if (this.editor_settings.auto_add_method_tag) {
    out.push('@method ' + escape(name));
  }

  if (!extraTagAfter) {
    out = this.add_extra_tags(out);
  }

  let typeInfo;
  let paramDescription;
  // if there are arguments, add a @param for each
  if (args) {
    // remove comments inside the argument list.
    args = args.replace(/\/\*.*?\*\//, '');
    const parsedArgs = this.parse_args(args);
    for (i = 0; i < parsedArgs.length; i++) {
      const argType = parsedArgs[i][0];
      const argName = parsedArgs[i][1];

      if (this.settings.typeInfo) {
        typeInfo = this.get_typeInfo(argType, argName);
      }
      if (this.editor_settings.param_description) {
        // define the string in two pieces to avoid lint complaints
        paramDescription = ' $' + '{1:[description]}';
      }

      out.push(`@param ${typeInfo || ''}${escape(argName)} ${paramDescription || ''}`);
    }
  }

  if (Object.prototype.hasOwnProperty.call(options, 'is_constructor') && options.is_constructor) {
    out.push('@constructor');
  }

  // return value type might be already available in some languages but
  // even then ask language specific parser if it wants it listed
  const retType = this.get_function_return_type(name, retval);
  if (retType !== null) {
    typeInfo = '';
    if (this.settings.typeInfo) {
      if (this.settings.curlyTypes) {
        typeInfo = ` {\${1:${retType || '[type]'}}}`;
      } else {
        typeInfo = ` \${1:${retType || '[type]'}}`;
      }
    }

    const formatArgs = [
      (this.editor_settings.return_tag || '@return'),
      typeInfo
    ];

    if (this.editor_settings.return_description) {
      // define the string in two pieces to avoid lint complaints
      formatStr = '%s%s %s$' + '{1:[description]}';
      let thirdArg = '';

      // the extra space here is so that the description will align with the param description
      if (args && this.editor_settings.align_tags === 'deep' && !this.editor_settings.per_section_indent) {
        thirdArg = ' ';
      }

      formatArgs.push(thirdArg);
    } else {
      formatStr = '%s%s';
    }

    // TODO
    // out.push(util.format(formatStr, formatArgs));
    formatArgs.forEach(function (element) {
      formatStr = util.format(formatStr, element);
    });
    out.push(formatStr);
  }
  const matchingNames = this.get_matching_notations(name);
  for (i = 0; i < matchingNames.length; i++) {
    const notation = matchingNames[i];
    if (notation.indexOf('tags') > -1) {
      out.concat(notation.args);
    }
  }

  if (extraTagAfter) { out = this.add_extra_tags(out); }

  return out;
};

DocsParser.prototype.get_function_return_type = function (name, retval) {
  // returns None for no return type. False meaning unknown, or a string
  if (/^[A-Z]/.test(name)) { return null; } // no return, but should add a class

  if (name.search(/[$_]?(?:set|add)($|[A-Z_])/) > -1) {
    // setter/mutator, no return
    return null;
  }

  if (name.search(/[$_]?(?:is|has)($|[A-Z_])/) > -1) {
    // functions starting with 'is' or 'has'
    return this.settings.bool;
  }

  return (this.guess_type_from_name(name) || false);
};

DocsParser.prototype.parse_args = function (args) {
  /*
    an array of tuples, the first being the best guess at the type, the second being the name
    */
  const out = [];
  if (!args) { return out; }
  // the current token
  let current = '';
  // characters which open a section inside which commas are not separators between different arguments
  const openQuotes = '"\'<(';
  // characters which close the the section. The position of the character here should match the opening
  // indicator in `openQuotes`
  const closeQuotes = '"\'>)';
  let matchingQuote = '';
  let insideQuotes = false;
  let nextIsLiteral = false;
  const blocks = [];
  // This flag indicates if current character position is following an
  // opening `[`
  let inArray = 0;
  let i;
  for (i = 0; i < args.length; i++) {
    const character = args.charAt(i);
    if (nextIsLiteral) { // previous char was a \
      current += character;
      nextIsLiteral = false;
    } else if (character === '\\') {
      nextIsLiteral = true;
    } else if (insideQuotes) {
      current += character;
      if (character === matchingQuote) { insideQuotes = false; }
    } else {
      if (character === ',' && !inArray) {
        blocks.push(current.trim());
        current = '';
      } else {
        // Following a `[` character indicate that the proceeding
        // characters are array values
        if (character === '[') {
          inArray++;
        } else if (character === ']') {
          inArray--;
        }
        current += character;
        const quoteIndex = openQuotes.indexOf(character);
        if (quoteIndex > -1) {
          matchingQuote = closeQuotes[quoteIndex];
          insideQuotes = true;
        }
      }
    }
  }

  blocks.push(current.trim());

  for (i = 0; i < blocks.length; i++) {
    const arg = blocks[i];
    const name = this.get_arg_name(arg);
    const type = this.get_arg_type(arg);
    if (name) {
      out.push([type, name]);
    }
  }
  return out;
};

DocsParser.prototype.get_arg_type = function (arg) {
  return null;
};

DocsParser.prototype.get_arg_name = function (arg) {
  return arg;
};

DocsParser.prototype.add_extra_tags = function (out) {
  const extraTags = this.editor_settings.extraTags || [];
  if (extraTags.length > 0) { out = out.concat(extraTags); }
  return out;
};

DocsParser.prototype.guess_type_from_name = function (name) {
  const matches = this.get_matching_notations(name);
  if (matches.length > 0) {
    const rule = matches[0];
    if (rule.indexOf('type') > -1) { return (this.settings.indexOf(rule.type) > -1) ? this.settings.rule.type : rule.type; }
  }
  if (name.search('(?:is|has)[A-Z_]') > -1) { return this.settings.bool; }

  if (name.search('^(?:cb|callback|done|next|fn)$') > -1) { return this.settings.function; }

  return false;
};

DocsParser.prototype.get_matching_notations = function (name) {
  const checkMatch = function (rule) {
    if (rule.indexOf('prefix') > -1) {
      // TODO :escape prefix
      let regex = new RegExp(rule.prefix);
      if (rule.prefix.search('.*[a-z]') > -1) { regex = new RegExp(regex.source + (/(?:[A-Z_]|$)/).source); }
      return regex.exec(name);
    } else if (rule.indexOf('regex') > -1) { return rule.regex.exec(name); }
  };

  return (this.editor_settings.notation_map || []).filter(checkMatch);
};

DocsParser.prototype.get_definition = function (editor, pos, readLine) {
  const maxLines = 25;

  let definition = '';
  let openBrackets = 0;

  let line, match, char;
  for (let i = 0; i < maxLines; i++) {
    line = readLine(editor, pos);
    pos.row += 1;

    // null, undefined or invaild
    if (typeof line !== 'string') {
      break;
    }

    line = line
    // strip one line comments
      .replace(/\/\/.*$/g, '')
    // strip block comments
      .replace(/\/\*.*\*\//g, '');

    // ignore everything in front of the actual function
    if (definition === '' && this.settings.fnOpener) {
      match = RegExp(this.settings.fnOpener).exec(line);

      if (match) {
        line = line.slice(match.index);
      }
    }

    // strip strings
    // const searchForBrackets = line
    //   .replace(/'(?:(\\.)|[^'])*'/g, '')
    //   .replace(/"(?:\\.|[^"])*"/g, '');

    for (char of line) {
      switch (char) {
        case '(': openBrackets++; break;
        case ')': openBrackets--; break;
      }
    }

    if (!/^\s*$/.exec(line)) {
      definition += line;
    }

    if (openBrackets < 0) {
      break;
    }
  }

  return definition;
};

module.exports = DocsParser;
