var JavaParser = require("./java");

function ProcessingParser(settings) {
    JavaParser.call(this, settings);
}
ProcessingParser.prototype = Object.create(JavaParser.prototype);

module.exports = ProcessingParser;
