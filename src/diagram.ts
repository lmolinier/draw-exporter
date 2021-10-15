import * as fs from 'fs';
import {Parser} from 'xml2js';

export class Diagram {
    id: string;
    name: string;
    index: number;
    content: any;

    constructor(id: string, name: string, index: number, content: any) {
        this.id = id;
        this.name = name;
        this.index = index;
        this.content = content;
    }
}

export class MxFile {
    content?: any;
    fname: string;
    xml: string;

    constructor(fname: string) {
        this.fname = fname;
    }

    parse(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            var data = fs.readFileSync(this.fname,'utf8');
            var parser = new Parser();
            var _this = this;
            this.xml = data;
            parser.parseString(data, function(err: Error, result: any) {
                if(err) {
                    reject(err);
                    return;
                }
                _this.content = result.mxfile;
                resolve(_this.content);
            });
        });
    } 

    get diagrams(): Map<String, Diagram> {
        return new Map((this.content.diagram as Array<any>)?.map((d: any, i: number, a: Diagram[]) => {
            return [d.$.name, new Diagram(d.$.id, d.$.name, i, d.mxGraphModel)];
        }));
    }
}