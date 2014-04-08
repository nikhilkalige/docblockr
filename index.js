/**
 *      We will be creating a basic parser for function and returning the doc string
 */
'use strict';
//module.exports.dockblockr = function(data, lang) {
//   console.log(data)
//}


function DocsParser(settings) {
    this.settings = settings;
    this.setup_settings()
    this.name_override = None
}

DocsParser.prototype.is_existing_comment = function(line) {
    return line.search('^\\s*\\*')
};

function JsParser() {

}


JsParser.prototype.setup_settings = function() {
    var identifier = '[a-zA-Z_$][a-zA-Z_$0-9]*';
    this.settings = {
        // curly brackets around the type information
        'curlyTypes': true,
        'typeInfo': true,
        'typeTag': self.viewSettings.get('jsdocs_override_js_var') or 'type',
        // technically, they can contain all sorts of unicode, but w/e
        'varIdentifier': identifier,
        'fnIdentifier':  identifier,
        'fnOpener': r'function(?:\s+' + identifier + r')?\s*\(',
        'commentCloser': ' */',
        'bool': 'Boolean',
        'function': 'Function'
    }
};

JsParser.prototype.parse_function = function(line) {
    regex =  new RegExp(
        //   fnName = function,  fnName : function
        '(?:(' + this.settings['varIdentifier'] + ')\\s*[:=]\\s*)?'
        + 'function'
        // function fnName
        + '(?:\\s+(' + this.settings['fnIdentifier'] + '))?'
        // (arg1, arg2)
        + '\\s*\\(\\s*(.*)\\)'
    )

    var matches = regex.exec(line)
    if(matches === null) {
        return null
    }
    for(var i=0;i < matches.length; i++) {
        console.log(i+ ':' + matches[i])
    }
    // grab the name out of "name1 = function name2(foo)" preferring name1
    var name = matches[1] || matches[2] || '';
    var args = matches[3];
    console.log(name)
    return [name, args, null]
}

JsParser.prototype.parse_var = function(self, line) {
    res = re.search(
        #   var foo = blah,
        #       foo = blah;
        #   baz.foo = blah;
        #   baz = {
        #        foo : blah
        #   }

        '(?P<name>' + self.settings['varIdentifier'] + ')\s*[=:]\s*(?P<val>.*?)(?:[;,]|$)',
        line
    )
    if not res:
        return None

    return (res.group('name'), res.group('val').strip())
}

JsParser.prototype.guess_type_from_value = function(val) {
    lowerPrimitives = self.viewSettings.get('jsdocs_lower_case_primitives') or False
    shortPrimitives = self.viewSettings.get('jsdocs_short_primitives') or False
    if is_numeric(val):
    return "number" if lowerPrimitives else "Number"
    if val[0] == '"' or val[0] == "'":
    return "string" if lowerPrimitives else "String"
    if val[0] == '[':
    return "Array"
    if val[0] == '{':
    return "Object"
    if val == 'true' or val == 'false':
    returnVal = 'Bool' if shortPrimitives else 'Boolean'
    return returnVal.lower() if lowerPrimitives else returnVal
    if re.match('RegExp\\b|\\/[^\\/]', val):
    return 'RegExp'
    if val[:4] == 'new ':
    res = re.search('new (' + self.settings['fnIdentifier'] + ')', val)
    return res and res.group(1) or None
    return None
}




module.exports.pr = parse_function
