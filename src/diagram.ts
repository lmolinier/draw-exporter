import { ipcRenderer } from 'electron';
import * as fs from 'fs';
import { cp } from 'original-fs';
import {Parser} from 'xml2js';

export class Layer {
    id: string;
    name?: string;
    style?: string;
    visible: boolean;
}

export class Diagram {
    id: string;
    name: string;
    index: number;
    content: any;

    constructor(id: string, name: string, index: number, content: any) {
        this.id = id;
        this.name = name;
        this.index = index;
        this.content = content[0];
    }

    get layers(): Map<String, Layer> {
        var layers = new Map<String, Layer>();
        this.content.root[0].mxCell
            .filter((elt: any) => {
                if(elt.$.parent === undefined || elt.$.parent != "0")
                    return false;
                return true;
            })
            .forEach((it: any) => {
                var name =  it.$.id=='1'?'background':it.$.value
                layers.set(name, {
                    id: it.$.id,
                    name: name,
                    style: it.$.style,
                    visible: !(it.$.visible == '0'),
                })
            });
        return layers;
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