var escape = function(str) {
    if (!str) {
        return '';
    }

    return ('' + str).replace('$', '\$').replace('{', '\{').replace('}', '\}');
};

module.exports = {
    escape: escape
};
