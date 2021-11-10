import * as fs from "fs";
import { Parser } from "xml2js";
import "pako";
import pako from "pako";

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
    this.content = content;
  }

  get layers(): Map<String, Layer> {
    var layers = new Map<String, Layer>();
    this.content.root[0].mxCell
      .filter((elt: any) => {
        if (elt.$.parent === undefined || elt.$.parent != "0") return false;
        return true;
      })
      .forEach((it: any) => {
        var name = it.$.id == "1" ? "background" : it.$.value;
        layers.set(name, {
          id: it.$.id,
          name: name,
          style: it.$.style,
          visible: !(it.$.visible == "0"),
        });
      });
    return layers;
  }
}

export class MxFile {
  _diagrams: Map<String, Diagram>;
  fname: string;
  xml: string;

  constructor(fname: string) {
    this.fname = fname;
  }

  async parse(): Promise<any> {
    var data = fs.readFileSync(this.fname, "utf8");
    var parser = new Parser();
    this.xml = data;

    var result = await parser.parseStringPromise(data);
    this._diagrams = new Map<String, Diagram>();

    var i = 0;
    var _this = this;
    for await (const d of result.mxfile.diagram as Array<any>) {
      if (d.mxGraphModel !== undefined) {
        _this._diagrams.set(
          d.$.name,
          new Diagram(d.$.id, d.$.name, i, d.mxGraphModel[0])
        );
      } else {
        // diagram data are b64/inflate
        var b = Buffer.from(d._, "base64");
        var inflated = unescape(pako.inflateRaw(b, { to: "string" }));

        var d2 = await parser.parseStringPromise(inflated);
        _this._diagrams.set(
          d.$.name,
          new Diagram(d.$.id, d.$.name, i, d2.mxGraphModel)
        );
      }
      i++;
    }
  }

  get diagrams(): Map<String, Diagram> {
    return this._diagrams;
  }
}
