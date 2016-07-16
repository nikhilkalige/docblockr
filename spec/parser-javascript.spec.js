"use babel"


import Parser from '../lib/languages/javascript'

describe('ParserJavascript', () => {

    let parser;

    beforeEach(() => {
        return atom.packages.activatePackage('docblockr')
            .then(() => {
                parser = new Parser(atom.config.get('docblockr'));
            });
    });

    describe('parse_function()', () => {
        it('should parse anonymous function', () => {
            const out = parser.parse_function('function() {}')
            expect(out).to.deep.equal(['function', '', null])
        })

        it('should parse named function', () => {
            const out = parser.parse_function('function foo() {}')
            expect(out).to.deep.equal(['foo', '', null])
        })

        it('should parse function params', () => {
            const out = parser.parse_function('function foo(foo, bar) {}')
            expect(out).to.deep.equal(['foo', 'foo, bar', null])
        })

        it('should parse function params width default', () => {
            const out = parser.parse_function('function foo(foo = "test", bar = \'test\') {}')
            expect(out).to.deep.equal(['foo', 'foo = "test", bar = \'test\'', null])
        })
    })

    describe('get_arg_type()', () => {
        it('should return no type', () => {
            const out = parser.get_arg_type('foo')
            expect(out).to.equal(null)
        })

        it('should return "Object" for "{}"', () => {
            const out = parser.get_arg_type('foo = {}')
            expect(out).to.equal('Object')
        })

        it('should return "Foo" for "new Foo()"', () => {
            const out = parser.get_arg_type('foo = new Foo()')
            expect(out).to.equal('Foo')
        })

        it('should return "Array" for "[]"', () => {
            const out = parser.get_arg_type('foo = []')
            expect(out).to.equal('Array')
        })

        it('should return "Array" for "[1, 2, 3]"', () => {
            const out = parser.get_arg_type('foo = [1, 2, 3]')
            expect(out).to.equal('Array')
        })

        it('should return "String" for "\'foo\'"', () => {
            const out = parser.get_arg_type('foo = \'foo\'')
            expect(out).to.equal('String')
        })

        it('should return "String" for "\'new Foo()\'"', () => {
            const out = parser.get_arg_type('foo = \'new Foo()\'')
            expect(out).to.equal('String')
        })

        it('should return "String" for "\'123\'"', () => {
            const out = parser.get_arg_type('foo = \'123\'')
            expect(out).to.equal('String')
        })

        it('should return "String" for "\'[]\'"', () => {
            const out = parser.get_arg_type('foo = \'[]\'')
            expect(out).to.equal('String')
        })

        it('should return "Number" for "123"', () => {
            const out = parser.get_arg_type('foo = 123')
            expect(out).to.equal('Number')
        })

        it('should return "Number" for "1.23"', () => {
            const out = parser.get_arg_type('foo = 1.23')
            expect(out).to.equal('Number')
        })
    })

    describe('get_arg_name()', () => {
        it('should return argument "foo"', () => {
            const out = parser.get_arg_name('foo')
            expect(out).to.equal('foo')
        })

        it('should return optional argument "foo" with default value "{}"', () => {
            const out = parser.get_arg_name('foo = {}')
            expect(out).to.equal('[foo={}]')
        })

        it('should return optional argument "foo" with default value "[]"', () => {
            const out = parser.get_arg_name('foo = []')
            expect(out).to.equal('[foo=[]]')
        })

        it('should return optional argument "foo" with default value "[1, 2, 3]"', () => {
            const out = parser.get_arg_name('foo = [1, 2, 3]')
            expect(out).to.equal('[foo=[1, 2, 3]]')
        })

        it('should return optional argument "foo" with default value "\'foo\'"', () => {
            const out = parser.get_arg_name('foo = \'foo\'')
            expect(out).to.equal('[foo=\'foo\']')
        })

        it('should return optional argument "foo" with default value "123"', () => {
            const out = parser.get_arg_name('foo = 123')
            expect(out).to.equal('[foo=123]')
        })
    })

    describe('parse_var()', () => {

        it('should return var "foo" with value "{}"', () => {
            const out = parser.parse_var('var foo = {}')
            expect(out).to.deep.equal(['foo', '{}'])
        })

        it('should return var "foo" with value "[]"', () => {
            const out = parser.parse_var('var foo = []')
            expect(out).to.deep.equal(['foo', '[]'])
        })

        it('should return var "foo" with value "\'foo\'"', () => {
            const out = parser.parse_var('var foo = \'foo\'')
            expect(out).to.deep.equal(['foo', '\'foo\''])
        })

        it('should return var "foo" with value "123"', () => {
            const out = parser.parse_var('var foo = 123')
            expect(out).to.deep.equal(['foo', '123'])
        })
    })
})
