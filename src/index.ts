import { app } from "electron";

import { OptionValues, program } from "commander";
import { sheetsCommand } from "./commands/sheets";
import { layersCommand } from "./commands/layers";
import { exportPngCommand } from "./commands/png";
import { exportPdfCommand } from "./commands/pdf";
import { exportSvgCommand } from "./commands/svg";

import { Exporter } from "./exporter";

async function main(): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const cli = program
      .name("draw-exporter")
      .action(function (inFile: string, opts: OptionValues) {
        cli.outputHelp();
        reject("No valid commands provided");
      })
      .version(app.getVersion());

    sheetsCommand(cli);
    layersCommand(cli);
    exportPdfCommand(cli);
    exportPngCommand(cli);
    exportSvgCommand(cli);

    try {
      cli
        .parseAsync()
        .then(() => {
          resolve(0);
        })
        .catch((reason: any) => {
          reject(reason);
        });
    } catch (e) {
      console.error("uncatched error");
      reject(e);
    }
  });
}

main()
  .then((code: number) => {
    Exporter.exit();
    process.exit(code);
  })
  .catch((reason: any) => {
    console.error(reason);
    process.exit(1);
  });
