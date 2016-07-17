"use babel"


import Parser from '../lib/languages/javascript'
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

var filepath = path.resolve(path.join(__dirname, 'dataset'));
var files = fs.readdirSync(filepath);

for (let name of files) {
    let parser_name = "Parser_" + name.split('.')[0];
    describe(parser_name, () => {
        let parser;
        let dataset = yaml.load(fs.readFileSync(path.join(filepath, name), 'utf8'));

        beforeEach(() => {
            return atom.packages.activatePackage('docblockr')
                .then(() => {
                    parser = new Parser(atom.config.get('docblockr'));
                });
        });

        for(let key in dataset) {
            describe(key, () => {
                dataset[key].forEach((data) => {
                    it(data[0], () => {
                        const out = parser[key](data[1]);
                        expect(out).to.deep.equal(data[2]);
                    });
                });
            });
        }
    });
}
