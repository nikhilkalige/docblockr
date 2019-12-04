const JsParser = require('../lib/languages/javascript');
const CppParser = require('../lib/languages/cpp');
const RustParser = require('../lib/languages/rust');
const PhpParser = require('../lib/languages/php');
const CoffeeParser = require('../lib/languages/coffee');
const ActionscriptParser = require('../lib/languages/actionscript');
const ObjCParser = require('../lib/languages/objc');
const JavaParser = require('../lib/languages/java');
const TypescriptParser = require('../lib/languages/typescript');
const ProcessingParser = require('../lib/languages/processing');
const SassParser = require('../lib/languages/sass');

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { expect } = require('chai');

const { describe, beforeEach, it } = global;

// Hack to let us call parsers by filename
const parsers = {
  JsParser,
  CppParser,
  RustParser,
  PhpParser,
  CoffeeParser,
  ActionscriptParser,
  ObjCParser,
  JavaParser,
  TypescriptParser,
  ProcessingParser,
  SassParser
};

var filepath = path.resolve(path.join(__dirname, 'dataset/languages'));
var files = fs.readdirSync(filepath);

for (const name of files) {
  const fileName = 'Parser_' + name.split('.')[0];
  describe(fileName, () => {
    let parser;
    const dataset = yaml.load(fs.readFileSync(path.join(filepath, name), 'utf8'));
    const parserName = dataset.name;
    delete dataset.name;

    beforeEach(() => {
      return global.atom.packages.activatePackage(path.resolve(__dirname, '../'))
        .then(() => {
          parser = new parsers[parserName](global.atom.config.get('docblockr'));
        });
    });

    for (const key in dataset) {
      describe(key, () => {
        dataset[key].forEach((data) => {
          it(data[0], () => {
            let out;
            if (Array.isArray(data[1])) {
              out = parser[key].apply(parser, data[1]);
            } else {
              out = parser[key](data[1]);
            }
            expect(out).to.deep.equal(data[2]);
          });
        });
      });
    }
  });
}
