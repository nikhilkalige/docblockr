const util = require('util');
const DocsParser = require('../docsparser');
const xregexp = require('xregexp');

function JsParser (settings) {
  // this.setup_settings();
  // call parent constructor
  DocsParser.call(this, settings);
}

JsParser.prototype = Object.create(DocsParser.prototype);

JsParser.prototype.setup_settings = function () {
  const identifier = '[a-zA-Z_$][a-zA-Z_$0-9]*';
  this.settings = {
    commentType: 'block',
    // curly brackets around the type information
    curlyTypes: true,
    typeInfo: true,
    typeTag: 'type',
    // technically, they can contain all sorts of unicode, but w/e
    varIdentifier: identifier,
    fnIdentifier: identifier,
    classIdentifier: identifier,
    fnOpener: 'function(?:\\s+' + identifier + ')?\\s*\\(',
    commentCloser: ' */',
    bool: 'Boolean',
    function: 'Function'
  };
};

JsParser.prototype.parse_class = function (line) {
  const regex = xregexp(
    '^\\s*class\\s+' +
        '(?P<name>' + this.settings.classIdentifier + ')' +
        '(:?\\s+extends\\s+(?P<extends>' + this.settings.classIdentifier + '))?'
  );

  const matches = xregexp.exec(line, regex);
  if (!matches) { return null; }

  return [matches.name, matches.extends || null];
};

JsParser.prototype.format_class = function (name, superClass) {
  const out = [];
  out.push(`\${1:[${escape(name)} description]}`);

  if (superClass) {
    out.push('@extends ' + superClass);
  }

  return out;
};

JsParser.prototype.parse_function = function (line) {
  // single quotes indicate what will be matched in each line
  const preFunction = '^' +
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

  const modifiers = '(?:\\bstatic\\s+)?(?P<promise>\\basync\\s+)?';

  const functionRegex = xregexp(
    preFunction +
        modifiers +
        //   var foo = 'function 'bar (baz, quaz) {}
        '(?:function(?P<generator>\\s*\\*)?)\\s*' +
        //   var foo = function 'bar '(baz, quaz) {}
        '(?:\\b(?P<name2>' + this.settings.fnIdentifier + '))?\\s*' +
        //   var foo = function bar '(baz, quaz)' {}
        '\\(\\s*(?P<args>.*?)\\)'
  );

  const methodRegex = xregexp(
    '^' +
        '\\s*' +
        modifiers +
        '(?P<generator>\\*)?\\s*' +
        '(?P<name2>' + this.settings.fnIdentifier + ')\\s*' +
        '\\(\\s*(?P<args>.*?)\\)\\s*' +
        '{'
  );

  const geterSetterMethodRegex = xregexp(
    '^' +
        '\\s*' +
        '(?:get|set)\\s+' +
        '(?P<name2>' + this.settings.fnIdentifier + ')\\s*' +
        '\\(\\s*(?P<args>.*?)\\)\\s*' +
        '{'
  );

  const arrowFunctionRegex = xregexp(
    preFunction +
        '(?P<promise>async\\s+)?' +
        '(?:' +
            //   var foo = 'bar' => {}
            '(?P<arg>' + this.settings.varIdentifier + ')' +
            '|' +
            //   var foo = '(bar, baz)' => {}
            '\\(\\s*(?P<args>.*?)\\)' +
        ')\\s*' +
        //   var foo = bar '=>' {}
        '=>\\s*'
  );

  let functionRegexMatch = null;
  // const methodRegexMatch = null;
  // const geterSetterMethodRegexMatch = null;
  // const arrowFunctionRegexMatch = null;

  // XXX: Note assignments
  const matches = (
    (functionRegexMatch = xregexp.exec(line, functionRegex)) ||
            (/* methodRegexMatch = */xregexp.exec(line, methodRegex)) ||
            (/* geterSetterMethodRegexMatch = */xregexp.exec(line, geterSetterMethodRegex)) ||
            (/* arrowFunctionRegexMatch = */xregexp.exec(line, arrowFunctionRegex))
  );

  if (matches === null) {
    return null;
  }
  // grab the name out of "name1 = function name2(foo)" preferring name1
  const name = matches.name1 || matches.name2 || '';
  const args = matches.args || matches.arg || null;

  // check for async method to set retval to promise
  let retval = null;
  if (matches.promise) {
    retval = 'Promise';
  } else if (matches.generator) {
    retval = 'Generator';
  }

  const options = {};
  if (functionRegexMatch && name.length > 0 && name[0] === name[0].toUpperCase()) {
    options.is_constructor = true;
  }

  return [name, args, retval, options];
};

JsParser.prototype.parse_var = function (line) {
  //   var foo = blah,
  //       foo = blah;
  //   baz.foo = blah;
  //   baz = {
  //        foo : blah
  //   }
  const regex = xregexp('(?P<name>' + this.settings.varIdentifier + ')\\s*[=:]\\s*(?P<val>.*?)(?:[;,]|$)');
  const matches = xregexp.exec(line, regex);
  if (matches === null) {
    return null;
  }
  // variable name, variable value
  return [matches.name, matches.val.trim()];
};

JsParser.prototype.parse_arg = function (arg) {
  const regex = xregexp(
    '(?P<name>' + this.settings.varIdentifier + ')(\\s*=\\s*(?P<value>.*))?'
  );

  return xregexp.exec(arg, regex);
};

JsParser.prototype.get_arg_type = function (arg) {
  const matches = this.parse_arg(arg);

  if (matches && matches.value) {
    return this.guess_type_from_value(matches.value);
  }

  return null;
};

JsParser.prototype.get_arg_name = function (arg) {
  const matches = this.parse_arg(arg);

  if (matches && matches.value) {
    return util.format('[%s=%s]', matches.name, matches.value);
  }

  return matches ? matches.name : arg;
};

JsParser.prototype.guess_type_from_value = function (val) {
  const lowerPrimitives = this.editor_settings.lower_case_primitives || false;
  const shortPrimitives = this.editor_settings.short_primitives || false;
  let varType;
  const capitalize = function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };
  if (this.is_numeric(val)) {
    varType = 'number';
    return (lowerPrimitives ? varType : capitalize(varType));
  }
  if ((val[0] === '\'') || (val[0] === '"')) {
    varType = 'string';
    return (lowerPrimitives ? varType : capitalize(varType));
  }
  if (val[0] === '[') {
    return 'Array';
  }
  if (val[0] === '{') {
    return 'Object';
  }
  if ((val === 'true') || (val === 'false')) {
    const retVal = (shortPrimitives ? 'bool' : 'boolean');
    return (lowerPrimitives ? retVal : capitalize(retVal));
  }
  let regex = new RegExp('^RegExp|^\\/[^/*].*\\/$');
  if (regex.test(val)) {
    return 'RegExp';
  }
  if (val.slice(0, 4) === 'new ') {
    regex = new RegExp('new (' + this.settings.fnIdentifier + ')');
    const matches = regex.exec(val);
    return (matches[0] && matches[1]) || null;
  }
  return null;
};

JsParser.prototype.get_function_return_type = function (name, retval) {
  if (name === 'constructor') {
    return null;
  }

  if (retval) {
    return retval;
  }
  return DocsParser.prototype.get_function_return_type.call(this, name, retval);
};

JsParser.prototype.is_existing_comment = function (line) {
  // handle ES2015 generator shorhand for Object
  // example: * funcName(arg1, arg2, ...restArg) {}
  if (/^\s*\*\s*[$_A-Za-z][$\w]+\s*\(.*?\)\s*\{/.test(line)) {
    return false;
  }
  return /^\s*\*/.test(line);
};

module.exports = JsParser;
