### Tests

Tests are written using [Mocha](https://mochajs.org/ "mocha") and [Chai](http://chaijs.com) and data specified in [Yaml](https://github.com/nodeca/js-yaml).

The tests for the languages files in `lib/languages` folder is specified in a separate yaml file for each language in `spec/dataset` folder. The yaml file has the following format

name: Name of the parser to use # Example: JsParser
    function_name_1:
    # The following data will be tested for the above function
    	-
    		- string to define the test case
    		- string argument passed to the function
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
        -
            -
            -
            -
    ...


All the test output values are compared to the expected value using `to.deep.equal` function, I thought of adding one more line where you could specify the function, but thought that would make it too convoluted.
