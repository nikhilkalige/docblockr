var escape = function(str) {
    return str.replace('$', '\$').replace('{', '\{').replace('}', '\}');
};

module.exports = {
    escape: escape
};
