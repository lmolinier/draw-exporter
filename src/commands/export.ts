import { Command, OptionValues } from "commander";
import { Exporter, ExportParams, ExportResult } from "../electron";
import { MxFile, Diagram } from "../diagram";
import * as fs from 'fs';

export function exportCommand(cli: Command) {
    cli.command("export <input-file>")
    .description("Export diagram")
    .option("-v, --verbose", "verbose output", false)
    .option("-t, --trace", "enable traces", false)

    .option("-f, --format <extension>", "export format (pdf, png, svg)", 'pdf')
    .option("-c, --crop", "crop to content", true)
    .option("-s, --sheet <name>", "select sheet to print by its name (default: first)", null)
    .option("-i, --sheet-index <number>", "select sheet by it index (if --sheet is not set)", "0")
    .action(function(inFile: string, opts: OptionValues) {
        return new Promise<void>((resolve, reject) => {
            var mxf = new MxFile(inFile);
            mxf.parse().then((content: any) => {
                if(opts.trace) {
                    console.error(opts);
                    console.error("XML content:");
                    console.error(content);
                }

                // Get sheet-index given the sheet
                var sheetIndex: number = Number(opts.sheetIndex);
                var sheetName: string = opts.sheet
                if(opts.sheet) {
                    sheetIndex = mxf.diagrams.get(opts.sheet)?.index | 0;
                } else {
                    mxf.diagrams.forEach((d: Diagram) => {
                        if(d.index == sheetIndex) {
                            sheetName = d.name;
                        }
                    });
                }

                Exporter.getInstance().on('ready', (exporter: Exporter) => {                  
                    exporter.export(mxf.xml, {
                        scale: 1,
                        crop: opts.crop,
                        format: opts.format,
                        sheet: sheetIndex,
                    }).then( (res: ExportResult) => {
                        console.log(res.buffer.byteLength);
                        fs.writeFile(`./${sheetName}.pdf`, res.buffer, () => {
                            resolve();
                        });
                    }).catch( (reason: any) => {
                        reject(reason);
                    });
                });

            }).catch((err: Error) => {
                reject(err);
            });
        });
    });
}