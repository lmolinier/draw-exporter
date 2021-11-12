import * as pdfjslib from "pdfjs-dist/legacy/build/pdf";

import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { createCanvas } from "canvas";
import { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";

class NodeCanvasFactory {
  constructor() {}

  create(width: number, height: number) {
    let canvas = createCanvas(width, height);
    let context = canvas.getContext("2d");
    return {
      canvas: canvas,
      context: context,
    };
  }

  reset(canvasAndContext: any, width: number, height: number) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext: any) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

export class DiffUtils {
  static async pdfToPngs(pdf: Buffer): Promise<Buffer[]> {
    let task = pdfjslib.getDocument({
      disableFontFace: true,
      data: Uint8Array.from(pdf),
      cMapUrl: "./node_modules/pdfjs-dist/cmaps/",
      cMapPacked: true,
    });
    let d = await task.promise;

    let bufs: Buffer[] = [];
    for (let index = 1; index <= d.numPages; index++) {
      bufs.push(await this.pdfPageToPng(d, index));
    }
    return bufs;
  }

  static async pdfPageToPng(
    doc: PDFDocumentProxy,
    pageNumber: number,
    scale?: number
  ): Promise<Buffer> {
    let page = await doc.getPage(pageNumber);
    let viewport = page.getViewport({ scale: scale ?? 1.38889 });
    let canvasFactory = new NodeCanvasFactory();
    let canvas = canvasFactory.create(viewport.width, viewport.height);

    await page.render({
      canvasContext: canvas.context,
      viewport: viewport,
      canvasFactory: canvasFactory,
    }).promise;

    let image = canvas.canvas.toBuffer();
    return image;
  }

  static diffPng(left: Buffer, right: Buffer, config?: { threshold?: number }) {
    return new Promise<{ ndiff: number; diff?: Buffer }>((resolve, reject) => {
      try {
        const leftpng = PNG.sync.read(left);
        const rightpng = PNG.sync.read(right);
        const { width, height } = leftpng;
        const diffpng = new PNG({ width, height });

        let threshold = config && config.threshold ? config.threshold : 0.05;

        let numDiffPixels = pixelmatch(
          rightpng.data,
          leftpng.data,
          diffpng.data,
          width,
          height,
          {
            threshold: threshold,
          }
        );
        resolve({ ndiff: numDiffPixels, diff: PNG.sync.write(diffpng) });
      } catch (error) {
        reject(error);
      }
    });
  }
}
