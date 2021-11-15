import { Command, OptionValues } from "commander";
import { ExportParams } from "../exporter";
import { MxFile } from "../diagram";
import { setupLogging, withLoggingOptions } from "../logging";
import { CommonOptions } from "./export/common";
import { ParseOptions } from "./export/parse";
import { doExport } from "./export/utils";

export function exportPngCommand(cli: Command) {
  withLoggingOptions(
    CommonOptions.with(
      ParseOptions.with(
        cli
          .command("png <input-file> <output-file>")
          .description("PNG Export diagram")
      )
    )
  )
    .option(
      "--no-transparent",
      "disable transparent background (if applicable)"
    )

    .action(function (inFile: string, outFile: string, opts: OptionValues) {
      setupLogging(opts);
      return new Promise<void>((resolve, reject) => {
        const mxf = new MxFile(inFile);
        mxf
          .parse()
          .then((content: any) => {
            let params: ExportParams = {
              scale: undefined,
              crop: undefined,
              format: "png",
              sheet: undefined,
              layers: [],
              options: {
                transparent: opts.transparent,
              },
            };

            try {
              params = ParseOptions.prepare(mxf, opts, params);
              params = CommonOptions.prepare(mxf, opts, params);
            } catch (e) {
              reject(e);
            }

            doExport(mxf, outFile, params)
              .then(() => {
                resolve();
              })
              .catch((reason: any) => {
                reject(reason);
              });
          })
          .catch((reason: any) => reject(reason));
      });
    });
}
