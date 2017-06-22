"use babel"

import JsParser from '../lib/languages/javascript';
import CppParser from '../lib/languages/cpp';
import RustParser from '../lib/languages/rust';
import PhpParser from '../lib/languages/php';
import CoffeeParser from '../lib/languages/coffee';
import ActionscriptParser from '../lib/languages/actionscript';
import ObjCParser from '../lib/languages/objc';
import JavaParser from '../lib/languages/java';
import TypescriptParser from '../lib/languages/typescript';
import ProcessingParser from '../lib/languages/processing';

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Hack to let us call parsers by filename
let parsers = {
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
};

var filepath = path.resolve(path.join(__dirname, 'dataset/languages'));
var files = fs.readdirSync(filepath);

for (let name of files) {
    let file_name = "Parser_" + name.split('.')[0];
    describe(file_name, () => {
        let parser;
        let dataset = yaml.load(fs.readFileSync(path.join(filepath, name), 'utf8'));
        let parser_name = dataset['name'];
        delete dataset['name'];

        beforeEach(() => {
            return atom.packages.activatePackage('docblockr')
                .then(() => {
                    parser = new parsers[parser_name](atom.config.get('docblockr'));
                });
        });

        for(let key in dataset) {
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
