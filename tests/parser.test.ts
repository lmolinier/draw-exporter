import * as fs from 'fs'
import * as path from 'path'

import { MxFile, Diagram, Layer } from '../src/diagram';

describe('parser tests', () => {
  it('loads a diagram with a compressed content', async () => {
    var fname = path.join(__dirname, 'drawio-diagrams', 'examples', 'AWSDiagram.xml');
    var mxf = new MxFile(fname);
    await mxf.parse().then((content: any) => {
        expect(mxf.diagrams.keys()).toContain("Page-1");
    })
  })
  it('loads a diagram with a compressed content (second)', async () => {
    var fname = path.join(__dirname, 'drawio-diagrams', 'examples', 'ElectricalDiagram.xml');
    var mxf = new MxFile(fname);
    await mxf.parse().then((content: any) => {
        expect(mxf.diagrams.keys()).toContain("Page-1");
    })
  })
  it('loads a diagram with layers', async () => {
    var fname = path.join(__dirname, 'drawio-diagrams', 'training-diagrams', 'drawio layers example.xml');
    var mxf = new MxFile(fname);
    await mxf.parse().then((content: any) => {
        expect(mxf.diagrams.keys()).toContain("Page-1");
        expect(mxf.diagrams.get("Page-1").layers.keys()).toContain("Level 2 - Diagram");
        expect(mxf.diagrams.get("Page-1").layers.keys()).toContain("Level 1 - Template");
    })
  })
})