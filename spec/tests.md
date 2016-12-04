# Tests

Tests are written using [Mocha](https://mochajs.org/ "mocha") and [Chai](http://chaijs.com) and data specified in [Yaml](https://github.com/nodeca/js-yaml).

The tests for the languages files in the `lib/languages` folder are specified
in a separate yaml file for each language in the `spec/dataset/languages/`
folder.

The yaml files have the following format:

```yaml
name: someParser # Name of the parser to use, Example: JsParser
    function_name_1:
        # The following data will be tested for the above function
        -
            - string to define the test case
            - argument passed to the function or an array with multiple arguments
            - expected output value
        -
            -
            -
            -

    function_name_2:
        -
            -
            -
            -
    ...
```

All the test output values are compared to the expected value using
`to.deep.equal` function, I thought of adding one more line where you could
specify the function, but thought that would make it too convoluted.

## Run tests

To execute tests locally execute `atom -t docblockr/spec` from your Atom package directory (`~/.atom/packages` in most cases):
```bash
cd ~/.atom/packages
atom --test docblockr/spec
```

or just:
```bash
npm test
```
