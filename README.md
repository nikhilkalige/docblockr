# Docblockr Package

DocBlockr is a package for [Atom][atom] which is designed to make writing documentation faster and easier.

The package currently supprts the following languages -

*  JavaScript

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

### Function documentation

However, if the line directly afterwards contains a function definition, then its name and parameters are parsed and some documentation is automatically added.

![](https://raw.githubusercontent.com/NikhilKalige/docblockr/master/resources/function-template.gif)

You can then press `tab` to move between the different fields.

If you have many arguments, or long variable names, it might be useful to spread your arguments across multiple lines. DocBlockr will handle this situation too:

![](https://raw.githubusercontent.com/NikhilKalige/docblockr/master/resources/long-args.gif)

DocBlockr will try to make an intelligent guess about the return value of the function.

- If the function name is or begins with "set" or "add", then no `@return` is inserted.
- If the function name is or begins with "is" or "has", then it is assumed to return a `Boolean`.
- In Javascript, if the function begins with an uppercase letter then it is assumed that the function is a class definition. No `@return` tag is added.

### Variable documentation

If the line following your docblockr contains a variable declaration, DocBlockr will try to determine the data type of the variable and insert that into the comment.

If you press `shift+enter` after the opening `/**` then the docblockr will be inserted inline.

![](https://raw.githubusercontent.com/NikhilKalige/docblockr/master/resources/vars.gif)

DocBlockr will also try to determine the type of the variable from its name. Variables starting with `is` or `has` are assumed to be booleans, and `callback`, `cb`, `done`, `fn`, and `next` are assumed to be functions. If you use your own variable naming system (eg: hungarian notation: booleans all start with `b`, arrays start with `arr`), you can define these rules yourself. 

### Note
All credits for this package goes to [SublimeJsdocs][jsdocs] who have created a wonderful plugin for Sublime Text. I have just ported the package to Atom and Javascript.

Also please note that all features have not yet been implemented. This is a work in progess.

[atom]: http://atom.io/
[jsdocs]: https://github.com/spadgos/sublime-jsdocs