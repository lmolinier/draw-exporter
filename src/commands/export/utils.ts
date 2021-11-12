import { OptionValues } from "commander";
import { Exporter, ExportParams, ExportResult } from "../../exporter";
import { MxFile, Diagram } from "../../diagram";
import { Category } from "typescript-logging";
import * as fs from "fs";

const log = new Category("export");

export function doExport(
  mxf: MxFile,
  outFile: string,
  params: ExportParams
): Promise<void> {
  log.info("launching export...");
  log.info(JSON.stringify(params));
  return new Promise<void>((resolve, reject) => {
    Exporter.getInstance().on("ready", (exporter: Exporter) => {
      exporter
        .export(mxf.xml, params)
        .then((res: ExportResult) => {
          try {
            log.info(`export size ${res.buffer.byteLength}B`);
            if (outFile == "-") {
              fs.write(1, res.buffer, () => {
                resolve();
              });
              return;
            }
            fs.writeFile(outFile, res.buffer, () => {
              resolve();
            });
          } catch (e) {
            reject(e);
          }
        })
        .catch((reason: any) => {
          reject(reason);
        });
    });
  });
}
