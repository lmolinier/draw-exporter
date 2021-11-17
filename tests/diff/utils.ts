import * as pdfjslib from "pdfjs-dist/legacy/build/pdf";
import pixelmatch from "pixelmatch";

import { PNG } from "pngjs";
import { svg2png } from "svg-png-converter";
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

  static async svgToPng(svg: Buffer) {
    return await svg2png({
      input: svg,
      format: "png",
      encoding: "buffer",
    });
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

  static diffPng(
    left: Buffer,
    right: Buffer,
    config?: { threshold?: number; tolerance?: number }
  ) {
    return new Promise<boolean>((resolve, reject) => {
      try {
        const leftpng = PNG.sync.read(left);
        const rightpng = PNG.sync.read(right);
        const { width, height } = leftpng;
        const diffpng = new PNG({ width, height });

        if (leftpng.alpha != rightpng.alpha) {
          resolve(false);
          return;
        }

        let threshold = config && config.threshold ? config.threshold : 0.1;
        let tolerance =
          config && config.tolerance
            ? config.tolerance
            : Math.floor(0.01 * height * width);

        // Check alpha
        let adiff = 0;
        for (var y = 0; y < height; y++) {
          for (var x = 0; x < width; x++) {
            var idx = (width * y + x) << 2;
            if (
              Math.abs(leftpng.data[idx + 3] - rightpng.data[idx + 3]) >
              threshold * 255
            ) {
              adiff++;
              continue;
            }
          }
        }
        if (adiff > tolerance) {
          resolve(false);
          return;
        }

        // Compare pixel by pixel (quite long operation...)
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

        resolve(numDiffPixels <= tolerance);
      } catch (error) {
        reject(error);
      }
    });
  }
}
