const { createRunner } = require('@atom/mocha-test-runner');

module.exports = createRunner({
    reporter: 'spec',
    testSuffixes: ['spec.js', 'spec.coffee']
});
