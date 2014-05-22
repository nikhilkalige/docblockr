String.prototype.keyMatch = function(re, flags){
    var is_global = false,
        results = [],
        keys = {},
        native_re=null,
        str = this,
        tmpstr = str;

    if(flags === undefined)
        flags = "";

    // find the keys inside the re, and place in mapping array {'1':'key1', '2':'key2', ...}
    var tmpkeys = re.match(/(?!\(\?\P\<)(\w+)(?=\>)/g);
    if(!tmpkeys){  // no keys, do a regular match
        return str.match(re);
    }
    else{
        for(var i=0,l=tmpkeys.length; i<l; i++){
            keys[i] = tmpkeys[i];
        }
    }

    // remove keys from regexp leaving standard regexp
    native_re = re.replace(/\?\P\<\w+\>/g,'');

    if(flags.indexOf('g') >= 0)
        is_global = true;
    flags = flags.replace('g','');

    native_re = RegExp(native_re, flags);

    do{
        // parse string
        var tmpmatch = tmpstr.match(native_re),
            tmpkeymatch = {},
            tmpsubstr = "";

        if(tmpmatch){
            // get the entire string found
            tmpsubstr = tmpmatch[0];

            tmpkeymatch[0] = tmpsubstr;

            // map them back out
            for(var i=1,l=tmpmatch.length; i<l; i++){
                tmpkeymatch[keys[i-1]] = tmpmatch[i];
            }

            // add to results
            results.push(tmpkeymatch);

            tmpstr = tmpstr.slice( (tmpstr.indexOf(tmpsubstr)+tmpsubstr.length) );

        }
        else{
            tmpstr = "";
        }
    } while(is_global && tmpstr.length > 0) // if global loop until end of str, else do once

    return results;
}
