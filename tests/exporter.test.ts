import * as fs from "fs";
import * as path from "path";
import * as child_process from "child_process";

import { Diff } from "./diff";
import { type } from "os";
import exp from "constants";

function launch(...args: string[]): Buffer {
  let cmd = "electron-forge start -- " + args.map((v) => `"${v}"`).join(" ");
  //console.log(cmd);
  let result = child_process.spawnSync(cmd, {
    shell: true,
    cwd: path.resolve(__dirname, ".."),
  });
  if (result.status != 0) {
    console.log(result.stderr.toString());
  }
  //console.log(result.stdout.toString());
  //console.log(result);
  expect(result.status).toBe(0);
  return result.stdout;
}

async function match(buf: Buffer, type: "pdf" | "png", snapshotName?: string) {
  var fname = snapshotName;
  if (snapshotName === undefined) {
    fname = expect.getState().currentTestName;
  }

  fs.mkdirSync(path.join(__dirname, "__snapshots__"), { recursive: true });
  fs.writeFileSync(
    path.join(__dirname, "__snapshots__", `${fname}.cur.${type}`),
    buf
  );

  var snap = fs.readFileSync(
    path.join(__dirname, "__snapshots__", `${fname}.snap.${type}`)
  );

  // Files under 2K are wierd!
  expect(buf.length).toBeGreaterThan(2 * 1024);

  var d = new Diff(snap, buf, { threshold: 0.05 });
  let res = await d.compare();
  if (typeof res == "boolean") {
    expect(res).toEqual(true);
  } else {
    expect(res.reduce((sum, v) => sum + v.ndiff, 0)).toEqual(0);
  }
}

describe("PDF exporter tests", () => {
  it("export simple", async () => {
    var fname = path.join(__dirname, "data", "AWSDiagram.xml");

    let out = launch("export", fname, "-");
    await match(out, "pdf", "AWSDiagram");
  });

  it("export only a layer", async () => {
    var fname = path.join(__dirname, "data", "drawio layers example.xml");

    let out = launch("export", "--layers", "Level 1 - Template", fname, "-");
    await match(out, "pdf", "OneLayer");
  });
});

describe("PNG exporter tests", () => {
  it("export simple", async () => {
    var fname = path.join(__dirname, "data", "AWSDiagram.xml");

    let out = launch("export", "--format", "png", fname, "-");
    await match(out, "png", "AWSDiagram");
  });

  it("export only a layer", async () => {
    var fname = path.join(__dirname, "data", "drawio layers example.xml");

    let out = launch(
      "export",
      "--format",
      "png",
      "--layers",
      "Level 1 - Template",
      fname,
      "-"
    );
    await match(out, "png", "OneLayer");
  });

  it("export with background", async () => {
    var fname = path.join(__dirname, "data", "AWSDiagram.xml");

    let out = launch(
      "export",
      "--format",
      "png",
      "--no-transparent",
      fname,
      "-"
    );
    await match(out, "png", "AWSDiagramWithBackground");
  });
});
