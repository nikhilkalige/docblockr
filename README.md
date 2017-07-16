# Docblockr Package
[![Build Status](https://img.shields.io/travis/nikhilkalige/docblockr/master.svg?style=flat-square)](https://travis-ci.org/nikhilkalige/docblockr)

[View the changelog](https://github.com/nikhilkalige/docblockr/blob/master/CHANGELOG.md)

DocBlockr is a package for [Atom][atom] which is designed to make writing documentation faster and easier.

The package currently supports the following languages -

* ActionScript
* C, C++, Cuda-C++
* CoffeeScript
* Groovy
* Haxe
* Java
* JavaScript
* ObjC, ObjC++
* PHP
* Processing
* Rust
* SASS
* TypeScript

## Installing

Use the Atom package manager, which can be found in the Settings view or
run `apm install docblockr` from the command line.

## Feature requests & bug reports

The main development branch is `develop` and the stable 'production' branch is `master`. Please remember to base your branch from `develop` and issue the pull request back to that branch.

## Usage

> Below are some examples of what the package does. Note that there are no keyboard shortcuts required to trigger these completions - just type as normal and it happens for you!

### Docblock completion

Pressing **enter** or **tab** after `/**` (or `###*` for Coffee-Script) will yield a new line and will close the comment.

![](https://raw.githubusercontent.com/NikhilKalige/docblockr/master/resources/basic.gif)

Single-asterisk comment blocks behave similarly:

![](https://raw.githubusercontent.com/NikhilKalige/docblockr/master/resources/basic-block.gif)

### Function documentation

However, if the line directly afterwards contains a function definition, then its name and parameters are parsed and some documentation is automatically added.

![](https://raw.githubusercontent.com/NikhilKalige/docblockr/master/resources/function-template.gif)

You can then press `tab` to move between the different fields.

If you have many arguments, or long variable names, it might be useful to spread your arguments across multiple lines. DocBlockr will handle this situation too:

![](https://raw.githubusercontent.com/NikhilKalige/docblockr/master/resources/long-args.gif)

In languages which support type hinting or default values, then those types are prefilled as the datatypes.


![](https://raw.githubusercontent.com/NikhilKalige/docblockr/master/resources/type-hinting.gif)

DocBlockr will try to make an intelligent guess about the return value of the function.

- If the function name is or begins with "set" or "add", then no `@return` is inserted.
- If the function name is or begins with "is" or "has", then it is assumed to return a `Boolean`.
- In Javascript, if the function begins with an uppercase letter then it is assumed that the function is a class definition. No `@return` tag is added.
- In PHP, some of the [magic methods][magicmethods] have their values prefilled:
  - `__construct`, `__destruct`, `__set`, `__unset`, `__wakeup` have no `@return` tag.
  - `__sleep` returns an `Array`.
  - `__toString` returns a `string`.
  - `__isset` returns a `bool`.

### Variable documentation

If the line following your docblockr contains a variable declaration, DocBlockr will try to determine the data type of the variable and insert that into the comment.

If you press `shift+enter` after the opening `/**` then the docblockr will be inserted inline.

![](https://raw.githubusercontent.com/NikhilKalige/docblockr/master/resources/vars.gif)

DocBlockr will also try to determine the type of the variable from its name. Variables starting with `is` or `has` are assumed to be booleans, and `callback`, `cb`, `done`, `fn`, and `next` are assumed to be functions. If you use your own variable naming system (eg: hungarian notation: booleans all start with `b`, arrays start with `arr`), you can define these rules yourself.

### Comment extension

Pressing enter inside a docblock will automatically insert a leading asterisk and maintain your indentation.

![](https://raw.githubusercontent.com/NikhilKalige/docblockr/master/resources/auto-indent.gif)

![](https://raw.githubusercontent.com/NikhilKalige/docblockr/master/resources/auto-indent-2.gif)

This applies to docblock comments `/** like this */` as well as inline double-slash comments `// like this`

![](https://raw.githubusercontent.com/NikhilKalige/docblockr/master/resources/single-line.gif)

In either case, you can press `shift+enter` to stop the automatic extension.

Oftentimes, when documenting a parameter, or adding a description to a tag, your description will cover multiple lines. If the line you are on is directly following a tag line, pressing `tab` will move the indentation to the correct position.

![](https://raw.githubusercontent.com/NikhilKalige/docblockr/master/resources/deep-indent.gif)

### Multiline comment decoration

If you write a multiline comment and use `Docblockr:Decorate Multiline`, Docblockr will create block comment decoration.

![](https://raw.githubusercontent.com/NikhilKalige/docblockr/master/resources/multiline-decorate.gif)

### Comment decoration

If you write a double-slash comment and then use `Docblockr:Decorate`, DocBlockr will 'decorate' that line for you.

    // Foo bar baz<<Docblockr:Decorate>>

    -- becomes

    /////////////////
    // Foo bar baz //
    /////////////////

### Reparsing a DocBlock

Sometimes, you'll perform some action which clears the fields (sections of text which you can navigate through using `tab`). This leaves you with a number of placeholders in the DocBlock with no easy way to jump to them.

With DocBlockr, you can reparse a comment and reactivate the fields by using command `Docblockr:Reparse`

### Reformatting paragraphs

Inside a comment block, hit `Docblockr:Wrap Lines` to wrap the lines to make them fit within your rulers. If you would like subsequent lines in a paragraph to be indented, you can adjust the `indentation_spaces_same_para` setting. For example, a value of `3` might look like this:

    /**
     * Duis sed arcu non tellus eleifend ullamcorper quis non erat. Curabitur
     *   metus elit, ultrices et tristique a, blandit at justo.
     * @param  {String} foo Lorem ipsum dolor sit amet.
     * @param  {Number} bar Nullam fringilla feugiat pretium. Quisque
     *   consectetur, risus eu pellentesque tincidunt, nulla ipsum imperdiet
     *   massa, sit amet adipiscing dolor.
     * @return {[Type]}
     */

## Configuration ##

You can access the configuration settings by entering `Docblockr` in atom settings window


- `indentation_spaces` *(Number)* The number of spaces to indent after the leading asterisk.

        // indentation_spaces = 1
        /**
         * foo
         */

        // indentation_spaces = 5
        /**
         *     foo
         */

- `align_tags` *(String)* Whether the words following the tags should align. Possible values are `'no'`, `'shallow'` and `'deep'`

    > For backwards compatibility, `false` is equivalent to `'no'`, `true` is equivalent to `'shallow'`

    `'shallow'` will align only the first words after the tag. eg:

        @param    {MyCustomClass} myVariable desc1
        @return   {String} foo desc2
        @property {Number} blahblah desc3

    `'deep'` will align each component of the tags, eg:

        @param    {MyCustomClass} myVariable desc1
        @return   {String}        foo        desc2
        @property {Number}        blahblah   desc3


- `extra_tags` *(Array.String)* An array of strings, each representing extra boilerplate comments to add to *functions*. These can also include arbitrary text (not just tags).

        // extra_tags = This is a cool function, @author nickf, @version ${1:[version]}
        /**<<enter>>
        function foo (x) {}

        /**
         * [foo description]
         * This is a cool function
         * @author nickf
         * @version [version]
         * @param  {[type]} x [description]
         * @return {[type]}
         */
        function foo (x) {}

    Basic variable substitution is supported here for the variables `date` and `datetime`, wrapped in double curly brackets.

        // extra_tags = @date {{date}}, @anotherdate {{datetime}}
        /**<<enter>>
        function foo() {}

        /**
         * [foo description]
         * @date     2013-03-25
         * @datetime 2013-03-25T21:16:25+0100
         * @return   {[type]}
         */

- `extra_tags_go_after` *(Boolean)* If true, the extra tags are placed at the end of the block (after param/return). Default: `false`

- `extend_double_slash` *(Boolean)* Whether double-slash comments should be extended. An example of this feature is described above. Default: `true`

- `deep_indent` *(Boolean)* Whether pressing tab at the start of a line in docblock should indent to match the previous line's description field. An example of this feature is described above. Default: `true`

- `notation_map` *(Array)* An array of notation objects. Each notation object must define either a `prefix` OR a `regex` property, and a `type` property.

- `return_tag` *(String)* The text which should be used for a `@return` tag. By default, `@return` is used, however this can be changed to `@returns` if you use that style.

- `spacer_between_sections` *(String)* If true, then extra blank lines are inserted between the sections of the docblock. If set to `"after_description"` then a spacer will only be added between the description and the first tag. Possible values are `"true"`, `"false"` and `"after_description"`. Default: `"false"`.

- `indentation_spaces_same_para` *(Number)* Described above in the *Reformatting paragraphs* section. Default: `1`

- `autoadd_method_tag` *(Boolean)* Add a `@method` tag to docblocks of functions. Default: `false`

- `simple_mode` *(Boolean)* If true, DocBlockr won't add a template when creating a doc block before a function or variable. Useful if you don't want to write Javadoc-style, but still want your editor to help when writing block comments. Default: `false`

- `lower_case_primitives` *(Boolean)* If true, primitive data types are added in lower case, eg "number" instead of "Number". Default: `false`

- `short_primitives` *(Boolean)* If true, the primitives `Boolean` and `Integer` are shortened to `Bool` and `Int`. Default: `false`

- `newline_after_block` *(Boolean)* If true, an extra line break is added after the end of a docblock to separate it from the code. Default `false`

- `c_style_block_comments` *(Boolean)* If true, block comments (starting `/* `) will have asterisks placed on subsequent newlines. Default `false`

### Note
All credits for this package goes to [SublimeJsdocs][jsdocs] who have created a wonderful plugin for Sublime Text. I have just ported the package to Atom and Javascript.

All features except macros have been implemented. Please create issues for bugs.

### TODO
Add test cases.

[atom]: http://atom.io/
[jsdocs]: https://github.com/spadgos/sublime-jsdocs
