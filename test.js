var js = require('./index');

var fu = 'function foobar(var, dat) { }';
var x = js.parser.parse_function(fu);
console.log(x);

var fu = 'function someLongFunctionName(withArguments, across,many,lines) { ';
var x = js.parser.parse_function(fu);
console.log(x);


var fu = 'var asdfff = "asddd"';
var x = js.parser.parse_var(fu);
console.log(x);



var asddd = "asdfasdfasdf"
