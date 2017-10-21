# 0.11.0 (16 Jul 2017)
* Add support for Processing (#275)

# 0.10.6 (16 Jul 2017)
* Fixed a subtle bug related to text inputs in Atom's docks (#278)
* Added support for final methods in PHP (#277)

# 0.10.5 (21 Jun 2017)
* Fixed constructors in c++ (#273)
* Fixed generic types (template) in c++ method signatures (#234)

# 0.10.4 (21 Jun 2017)
* Nothing

# 0.10.3 (19 May 2017)
* Fixed missing `@return` annotations in PHP code (#269)

# 0.10.2 (19 May 2017)
* Fixed last release

# 0.10.1 (19 May 2017)
* Fixed Uncaught TypeError in editors not in the workspace (#268)

# 0.10.0 (18 May 2017)
* Added method to automatically add `@constructor` annotations in JavaScript (#34)
* Fixed `spacer_between_sections` setting (#208)
* Fixed recognition of Java methods with an array return type (#244)

# 0.9.5 (18 May 2017)
* Fixed handling of editors not in the workspace (#266)
* Fixed recognition of varibles and functions in PHP (#259)

# 0.9.4 (27 Mar 2017)
* Fixed typo regarding curly types

# 0.9.3 (19 Mar 2017)
* Fixed Java: Uncaught TypeError: Cannot read property 'search' of undefined

# 0.9.2 (19 Mar 2017)
* Added/Fixed support for shorthand method definitions
* Fixed TextEditor.prototype.displayBuffer deprecation
* Prevent exception if arguments can't be parsed

# 0.9.1 (5 Dec 2016)
* Fixed exception when adding `/**` to the end of a file (#233)

# 0.9.0 (4 Dec 2016)
* Improved treatment of c-style block comments (#231)
* Added option `c_style_block_comments` to turn on/off c-style block comments (#231)

# 0.8.8 (4 Dec 2016)
* Fixed problem with `throws` declaration in Java code (#156)
* Updated extend functionality to grab everything associated with the comment (#225)

# 0.8.7 (6 Oct 2016)
* Fixed error when using `Wrap Lines`

# 0.8.6 (6 Oct 2016)
* Fixed problem with immediately returned JS closures
* Improved support for ES2015 Generator functions
* Fixed problem with unnamed function parameters in C++

# 0.8.5 (1 Sep 2016)
* Fixed problems when extending comments which contain a slash

# 0.8.4 (25 Aug 2016)
* Added support for exported JS functions
* Added support for async JS functions and identify the return type as Promise
* Added support for static JS functions

# 0.8.3 (19 Aug 2016)
* Added support for PHP7 return types
* Added tests for functions with multiple arguments
* Preserve indentation while line wrapping

# 0.8.2 (10 Aug 2016)
* Added support for uppercase boolean literals in PHP

# 0.8.1 (10 Aug 2016)
* Don't add an asterisk when hitting enter after a block comments

# 0.8.1 (9 Aug 2016)
* No changes; just going to v0.8

# 0.7.5 (9 Aug 2016)
* Fixed problems with falsely detected JS functions
* Added support for ES 2015 arrow functions
* Improved specs for the JS parser
* Fixed problems with Java annotation

# 0.7.4 (1 Aug 2016)
* Added better Rust support
* Fixed problem with optional arguments in JS functions
* Small amount of specs added

# 0.7.3 (10 July 2015)
* Identifies variable args in the c++ parser
* Fixed parameters handling in one-lined function

# 0.7.2 (23 May 2015)
* Fixed TypescriptParser
* C++ language detection fixed
* Added some basic ES6/2015 support
* Respect extend double slash setting
* Bug correction on shallow indent mode

# 0.5.8 (23 Aug 2014)
* Extra tags error fixed
* Javascript variable parser fixed
* Some additional minor issues fixed

# 0.5.7 (28 July 2014)
* Fixed parse_var function arguments bug

# 0.5.6 (26 July 2014)
* PHP language detection fixed
* PHP function regex error fixed

# 0.5.5 (25 July 2014)
* Extend line comment setting unused fixed

# 0.5.4 (25 July 2014)
* Typo fixed

# 0.5.3 (25 July 2014)
* Wrap lines error fixed

# 0.5.2 (29 May 2014)
* License Updated

# 0.5.1 (28 May 2014)
* Scope selector bug fixed

# 0.5.0 (26 May 2014)
* Named regex added to fix parser errors
* Multi line comment decorate feature added

# 0.4.2 (9 May 2014)
* Scope based checks added

# 0.4.1 (1 May 2014)
* Readme fixed
* Changelog Update

# 0.4.0 (1 May 2014)
* Language support ported for all languages
* Moved all files to Javascript
* Added support for all parent package functionalities
* Macros remain unsupported

# 0.3.0 (27 Apr 2014)
* Made parser library editor independent

# 0.1.0 - 0.2.1 (26 Apr 2014)
* Initial release
