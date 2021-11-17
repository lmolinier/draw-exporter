import * as fs from "fs";
import * as path from "path";
import * as child_process from "child_process";

import { DiffPdf, DiffPng, DiffSvg } from "./diff";

function launch(...args: string[]) {
  let cmd = "electron-forge start -- " + args.map((v) => `"${v}"`).join(" ");

  let result = child_process.spawnSync(cmd, {
    shell: true,
    cwd: path.resolve(__dirname, ".."),
  });
  if (result.status != 0) {
    console.log(`command: ${cmd}`);
    console.log(`cwd: ${path.resolve(__dirname, "..")}`);
    console.log(result.stdout.toString());
    console.log(result.stderr.toString());
    console.log(result);
  }
  expect(result.status).toBe(0);
}

async function run(
  fname: string,
  type: "pdf" | "png" | "svg",
  snapshotName?: string,
  opts?: string[]
) {
  if (snapshotName === undefined) {
    snapshotName = expect.getState().currentTestName;
  }
  var oname = path.join(
    __dirname,
    "__snapshots__",
    `${snapshotName}.cur.${type}`
  );

  // Launch the execution
  launch(type, ...(opts ?? []), fname, oname);

  // Compare with snapshot
  var buf = fs.readFileSync(oname);
  var snap = fs.readFileSync(
    path.join(__dirname, "__snapshots__", `${snapshotName}.snap.${type}`)
  );

  // Files under 2K are wierd!
  expect(buf.length).toBeGreaterThan(2 * 1024);

  var d: any;
  switch (type) {
    case "pdf":
      d = new DiffPdf(snap, buf, { threshold: 0.05 });
      break;
    case "png":
      d = new DiffPng(snap, buf, { threshold: 0.05 });
      break;
    case "svg":
      d = new DiffSvg(snap, buf);
      break;
  }
  expect(await d.compare()).toEqual(true);
}

describe("PDF exporter tests", () => {
  it("export simple", async () => {
    var fname = path.join(__dirname, "data", "AWSDiagram.xml");
    await run(fname, "pdf", "AWSDiagram");
  });

  it("export only a layer", async () => {
    var fname = path.join(__dirname, "data", "drawio layers example.xml");

    let out = launch("pdf", "--layers", "Level 1 - Template", fname, "-");
    await run(fname, "pdf", "OneLayer", ["--layers", "Level 1 - Template"]);
  });
});

describe("PNG exporter tests", () => {
  it("export simple", async () => {
    var fname = path.join(__dirname, "data", "AWSDiagram.xml");
    await run(fname, "png", "AWSDiagram");
  });

  it("export only a layer", async () => {
    var fname = path.join(__dirname, "data", "sample.xml");
    await run(fname, "png", "sampleOneLayer", [
      "--sheet",
      "Page-2",
      "--layers",
      "Layer-1",
    ]);
  });

  it("export only another layer", async () => {
    var fname = path.join(__dirname, "data", "sample.xml");
    await run(fname, "png", "sampleAnotherLayer", [
      "--sheet",
      "Page-2",
      "--layers",
      "Layer-2",
    ]);
  });

  it("export only some layers", async () => {
    var fname = path.join(__dirname, "data", "sample.xml");
    await run(fname, "png", "sampleSomeLayers", [
      "--sheet",
      "Page-2",
      "--layers",
      "Layer-1,Layer-2",
    ]);
  });

  it("export with background", async () => {
    var fname = path.join(__dirname, "data", "AWSDiagram.xml");
    await run(fname, "png", "AWSDiagramWithBackground", ["--no-transparent"]);
  });
});

describe("SVG exporter tests", () => {
  it("export simple", async () => {
    var fname = path.join(__dirname, "data", "AWSDiagram.xml");
    await run(fname, "svg", "AWSDiagram");
  });

  it("export only a layer", async () => {
    var fname = path.join(__dirname, "data", "drawio layers example.xml");
    await run(fname, "svg", "OneLayer", ["--layers", "Level 1 - Template"]);
  });
});
