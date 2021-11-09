import * as fs from 'fs'
import * as path from 'path'
import * as child_process from 'child_process';

function launch(...args: string[]): Buffer {
    let cmd = "tsc && electron-forge start -- "+ args.map(v => `'${v}'`).join(" ")
    let result = child_process.spawnSync(cmd, {shell:true, cwd: path.resolve(__dirname, "..")});
    //if(result.status != 0) {
        console.log(result.stderr.toString());
    //}
    expect(result.status).toBe(0);
    return result.stdout
}

function match(buf:Buffer, snapshotName?: string) {
    var fname = snapshotName;
    if(snapshotName === undefined) {
        fname = expect.getState().currentTestName;
    }
    fs.mkdirSync(path.join(__dirname, "__snapshots__", "data"), {recursive: true});
    fs.writeFileSync(path.join(__dirname, "__snapshots__", "data", `${fname}.pdf`), buf);

    // Match to snapshot by removing the 1K header
    expect(buf.slice(1024).toString("base64")).toMatchSnapshot();
}

describe('PDF exporter tests', () => {
    it('export simple', async () => {
        var fname = path.join(__dirname, 'drawio-diagrams', 'examples', 'AWSDiagram.xml');

        let out = launch("export", fname, "-");
        match(out);
    })

    it('export only a layer', async () => {
        var fname = path.join(__dirname, 'drawio-diagrams', 'training-diagrams', 'drawio layers example.xml');

        let out = launch("export", "--layers", "Level 1 - Template", fname, "-");
        match(out);
    })
})
