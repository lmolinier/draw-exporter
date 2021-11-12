import * as path from "path";

import { DiffUtils } from "./utils";

class DiffConfig {
  threshold?: number;
}

export class DiffFile {
  left: Buffer;
  right: Buffer;

  constructor(left: Buffer, right: Buffer) {
    this.left = left;
    this.right = right;
  }

  async compare(): Promise<boolean> {
    // Check if buffer equals
    return this.left.compare(this.right) === 0;
  }
}

export class DiffPng extends DiffFile {
  config: DiffConfig;

  constructor(left: Buffer, right: Buffer, config?: DiffConfig) {
    super(left, right);
    this.config = config;
  }

  async compare(): Promise<boolean> {
    if (await super.compare()) {
      return true;
    }

    let res = await DiffUtils.diffPng(this.left, this.right, {
      threshold: this.config.threshold,
    });
    return res.ndiff == 0;
  }
}

export class DiffPdf extends DiffFile {
  left: Buffer;
  right: Buffer;
  config: DiffConfig;

  constructor(left: Buffer, right: Buffer, config?: DiffConfig) {
    super(left, right);
    this.config = config;
  }

  async compare(): Promise<boolean> {
    // #1: Check if file matches
    if (await super.compare()) {
      return true;
    }

    // #2: Else, convert the PDF to PNG
    let leftPngs = await DiffUtils.pdfToPngs(this.left);
    let rightPngs = await DiffUtils.pdfToPngs(this.right);

    // #2.1: same number of pages
    if (leftPngs.length != rightPngs.length) {
      return false;
    }

    for (let index = 0; index < leftPngs.length; index++) {
      let m = await new DiffPng(
        leftPngs[index],
        rightPngs[index],
        this.config
      ).compare();
      if (!m) {
        return false;
      }
    }
    return true;
  }
}
