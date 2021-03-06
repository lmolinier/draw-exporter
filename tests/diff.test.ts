import * as fs from "fs";
import * as path from "path";

import { DiffUtils } from "./diff/utils";

describe("Diff tests", () => {
  it("convert PDF to PNG 1", async () => {
    var fname = "test-diff-1";

    let buf = fs.readFileSync(path.join(__dirname, "data", `${fname}.pdf`));
    let pngs = await DiffUtils.pdfToPngs(buf);

    expect(pngs).toHaveLength(1);
    expect(pngs[0].length).toBeGreaterThan(340000);
    //fs.writeFileSync(path.join(__dirname, "__snapshots__", `${fname}.png`), pngs[0]);
  });
  it("convert PDF to PNG 2", async () => {
    var fname = "test-diff-2";

    let buf = fs.readFileSync(path.join(__dirname, "data", `${fname}.pdf`));
    let pngs = await DiffUtils.pdfToPngs(buf);

    expect(pngs).toHaveLength(1);
    expect(pngs[0].length).toBeGreaterThan(340000);
    //fs.writeFileSync(path.join(__dirname, "__snapshots__", `${fname}.png`), pngs[0]);
  });

  it("convert SVG to PNG", async () => {
    var fname = "test-diff-3";

    let buf = fs.readFileSync(path.join(__dirname, "data", `${fname}.svg`));
    let png = await DiffUtils.svgToPng(buf);

    expect(png.length).toBeGreaterThan(300000);
    //fs.writeFileSync(path.join(__dirname, "data", `${fname}.png`), png);
  });

  it("diff PNGs", async () => {
    let a = "test-diff-1";
    let b = "test-diff-2";

    let buf1 = fs.readFileSync(path.join(__dirname, "data", `${a}.pdf`));
    let buf2 = fs.readFileSync(path.join(__dirname, "data", `${b}.pdf`));

    // ensure PDF images are not strictly same
    expect(buf1.toString("base64")).not.toEqual(buf2.toString("base64"));

    // convert to PNG
    let png1s = await DiffUtils.pdfToPngs(buf1);
    expect(png1s).toHaveLength(1);
    let png1 = png1s[0];

    let png2s = await DiffUtils.pdfToPngs(buf2);
    expect(png2s).toHaveLength(1);
    let png2 = png2s[0];

    // ensure this is the same image
    let result = await DiffUtils.diffPng(png1, png2);
    expect(result).toBeTruthy();
  });

  it("diff PNGs with/witout background", async () => {
    let a = "diff-background.png";
    let b = "diff-wo-background.png";

    let buf1 = fs.readFileSync(path.join(__dirname, "data", a));
    let buf2 = fs.readFileSync(path.join(__dirname, "data", b));

    // ensure PDF images are not strictly same
    expect(buf1.toString("base64")).not.toEqual(buf2.toString("base64"));

    // ensure this is the *NOT* same image
    let result = await DiffUtils.diffPng(buf1, buf2);
    expect(result).toBeFalsy();
  });
});
