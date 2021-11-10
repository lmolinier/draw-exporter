import * as fs from 'fs'
import * as path from 'path'
import * as child_process from 'child_process';

import { Diff } from './diff';
import { type } from 'os';
import exp from 'constants';

function launch(...args: string[]): Buffer {
    let cmd = "electron-forge start -- "+ args.map(v => `'${v}'`).join(" ")
    child_process.spawnSync("tsc", {shell:true, cwd: path.resolve(__dirname, "..")});
    let result = child_process.spawnSync(cmd, {shell:true, cwd: path.resolve(__dirname, "..")});
    if(result.status != 0) {
        console.log(result.stderr.toString());
    }
    expect(result.status).toBe(0);
    return result.stdout
}

async function match(buf:Buffer, snapshotName?: string) {
    var fname = snapshotName;
    if(snapshotName === undefined) {
        fname = expect.getState().currentTestName;
    }

    fs.mkdirSync(path.join(__dirname, "__snapshots__"), {recursive: true});
    fs.writeFileSync(path.join(__dirname, "__snapshots__", `${fname}.cur.pdf`), buf);

    var snap = fs.readFileSync(path.join(__dirname, "__snapshots__", `${fname}.snap.pdf`));

    // Files under 2K are wierd!
    expect(buf.length).toBeGreaterThan(2*1024);

    var d = new Diff(snap, buf, {threshold: 0.05});
    let res = await d.compare()
    if(typeof res == "boolean") {
        expect(res).toEqual(true);
    } else {
        expect(res.reduce((sum, v) => sum + v.ndiff, 0)).toEqual(0);
    }
}

describe('PDF exporter tests', () => {
    it('export simple', async () => {
        var fname = path.join(__dirname, 'drawio-diagrams', 'examples', 'AWSDiagram.xml');

        let out = launch("export", fname, "-");
        await match(out, 'AWSDiagram');
    })

    it('export only a layer', async () => {
        var fname = path.join(__dirname, 'drawio-diagrams', 'training-diagrams', 'drawio layers example.xml');

        let out = launch("export", "--layers", "Level 1 - Template", fname, "-");
        await match(out);
    })
})
