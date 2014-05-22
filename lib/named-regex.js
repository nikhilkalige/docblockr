function NamedRegex(pattern, flags) {
    var tokens;
    if(this.is_regexp(pattern)) {
        throw new('Regexp not accepted');
    }

    pattern = pattern === undefined ? '' : String(pattern);
    flags = flags === undefined ? '' : String(flags);

    var result, output, pos, scope;
    while (pos < pattern.length) {
        do {
            // Check for custom tokens at the current position
            result = this.run_tokens(pattern, flags, pos, scope, context);
            // If the matched token used the `reparse` option, splice its output into the
            // pattern before running tokens again at the same position
            if (result && result.reparse) {
                pattern = pattern.slice(0, pos) +
                    result.output +
                    pattern.slice(pos + result.match_length);
            }
        } while (result && result.reparse);

        if (result) {
            output += result.output;
            pos += (result.match_length || 1);
        } else {
            // Get the native token at the current position
            token = self.exec(pattern, nativeTokens[scope], pos, 'sticky')[0];
            output += token;
            pos += token.length;
        }
    }
};

self.isRegExp = function(value) {
    return toString.call(value) === '[object RegExp]';
    //return isType(value, 'RegExp');
};

self.exec = function(str, regex, pos, sticky) {
    var cacheFlags = 'g', match, r2;

    regex[REGEX_DATA] = regex[REGEX_DATA] || getBaseProps();

    // Shares cached copies with `XRegExp.match`/`replace`
    r2 = regex[REGEX_DATA][cacheFlags] || (
        regex[REGEX_DATA][cacheFlags] = copy(regex, {
            add: cacheFlags,
            remove: sticky === false ? 'y' : ''
        })
    );

    r2.lastIndex = pos = pos || 0;

    // Fixed `exec` required for `lastIndex` fix, named backreferences, etc.
    match = fixed.exec.call(r2, str);

    if (sticky && match && match.index !== pos) {
        match = null;
    }

    if (regex.global) {
        regex.lastIndex = match ? r2.lastIndex : 0;
    }

    return match;
};

/* Named capturing group; match the opening delimiter only: `(?<name>`. Capture names can use the
 * characters A-Z, a-z, 0-9, _, and $ only. Names can't be integers. Supports Python-style
 * `(?P<name>` as an alternate syntax to avoid issues in recent Opera (which natively supports the
 * Python-style syntax). Otherwise, XRegExp might treat numbered backreferences to Python-style
 * named capture as octals.
 */
add(
    /\(\?P?<([\w$]+)>/,
    function(match) {
        // Disallow bare integers as names because named backreferences are added to match
        // arrays and therefore numeric properties may lead to incorrect lookups
        if (!isNaN(match[1])) {
            throw new SyntaxError('Cannot use integer as capture name ' + match[0]);
        }
        if (match[1] === 'length' || match[1] === '__proto__') {
            throw new SyntaxError('Cannot use reserved word as capture name ' + match[0]);
        }
        if (indexOf(this.captureNames, match[1]) > -1) {
            throw new SyntaxError('Cannot use same name for multiple groups ' + match[0]);
        }
        this.captureNames.push(match[1]);
        this.hasNamedCapture = true;
        return '(';
    }
);

/* Capturing group; match the opening parenthesis only. Required for support of named capturing
 * groups. Also adds explicit capture mode (flag n).
 */
add(
    /\((?!\?)/,
    function(match, scope, flags) {
        if (flags.indexOf('n') > -1) {
            return '(?:';
        }
        this.captureNames.push(null);
        return '(';
    },
    {optionalFlags: 'n'}
);


self.addToken = function(regex, handler, options) {
        options = options || {};
        var optionalFlags = options.optionalFlags, i;

        if (options.flag) {
            registerFlag(options.flag);
        }

        if (optionalFlags) {
            optionalFlags = nativ.split.call(optionalFlags, '');
            for (i = 0; i < optionalFlags.length; ++i) {
                registerFlag(optionalFlags[i]);
            }
        }

        // Add to the private list of syntax tokens
        tokens.push({
            regex: copy(regex, {add: 'g' + (hasNativeY ? 'y' : '')}),
            handler: handler,
            scope: options.scope || defaultScope,
            flag: options.flag,
            reparse: options.reparse
        });

        // Reset the pattern cache used by the `XRegExp` constructor, since the same pattern and
        // flags might now produce different results
        self.cache.flush('patterns');
    };

/**
 * Runs built-in and custom regex syntax tokens in reverse insertion order at the specified
 * position, until a match is found.
 * @private
 * @param {String} pattern Original pattern from which an XRegExp object is being built.
 * @param {String} flags Flags being used to construct the regex.
 * @param {Number} pos Position to search for tokens within `pattern`.
 * @param {Number} scope Regex scope to apply: 'default' or 'class'.
 * @param {Object} context Context object to use for token handler functions.
 * @returns {Object} Object with properties `matchLength`, `output`, and `reparse`; or `null`.
 */
NamedRegex.prototype.run_tokens = function(pattern, flags, pos, scope, context) {
    var i = this.tokens.length;
    var result = null;
    var match, t;

    // Run in reverse insertion order
    while (i--) {
        t = this.tokens[i];
        if(!t.flag || flags.indexOf(t.flag) > -1)) {
            match = this.exec(pattern, t.regex, pos, 'sticky');
            if (match) {
                result = {
                    match_length: match[0].length,
                    output: t.handler.call(context, match, scope, flags),
                    reparse: t.reparse
                };
                // Finished with token tests
                break;
            }
        }
    }
    return result;
}

/**
 * Adds named capture support (with backreferences returned as `result.name`), and fixes browser
 * bugs in the native `RegExp.prototype.exec`. Calling `XRegExp.install('natives')` uses this to
 * override the native method. Use via `XRegExp.exec` without overriding natives.
 * @private
 * @param {String} str String to search.
 * @returns {Array} Match array with named backreference properties, or `null`.
 */
fixed.exec = function(str) {
    var origLastIndex = this.lastIndex,
        match = nativ.exec.apply(this, arguments),
        name,
        r2,
        i;

    if (match) {
        // Attach named capture properties
        if (this[REGEX_DATA] && this[REGEX_DATA].captureNames) {
            // Skip index 0
            for (i = 1; i < match.length; ++i) {
                name = this[REGEX_DATA].captureNames[i - 1];
                if (name) {
                    match[name] = match[i];
                }
            }
        }

        // Fix browsers that increment `lastIndex` after zero-length matches
        if (this.global && !match[0].length && (this.lastIndex > match.index)) {
            this.lastIndex = match.index;
        }
    }
    return match;
};
