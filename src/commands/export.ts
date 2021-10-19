import { Command, OptionValues } from "commander";
import { Exporter, ExportParams, ExportResult } from "../exporter";
import { MxFile, Diagram, Layer } from "../diagram";
import * as fs from 'fs';
import { SetupLogging, WithLoggingOptions } from "../logging";
import { Category } from "typescript-logging";

const log = new Category("export");

export function exportCommand(cli: Command) {
    WithLoggingOptions(cli.command("export <input-file>")
    .description("Export diagram")
    )
    .option("-f, --format <extension>", "export format (pdf, png, svg)", 'pdf')
    .option("-c, --crop", "crop to content", true)
    
    .option("-s, --sheet <name>", "select sheet to print by its name (default: first)", null)
    .option("--sheet-index <number>", "select sheet by it index (if --sheet is not set)", "0")

    .option("-l, --layers <layers>", "comma separated list of layers names to export (default: current view)", "")
    .option("--layer-ids <layer-ids>", "comma separated list of layers ID to export (default: current view)", "")

    .action(function(inFile: string, opts: OptionValues) {
        SetupLogging(opts);
        return new Promise<void>((resolve, reject) => {
            var mxf = new MxFile(inFile);
            mxf.parse().then((content: any) => {

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

                var layers = new Set<string>();
                opts.layers.split(',').filter((e: string) => e!='').forEach( (element: string) => {
                    if(mxf.diagrams.get(sheetName).layers.has(element)) {
                        layers.add(mxf.diagrams.get(sheetName).layers.get(element).id)
                    }
                });
                opts.layerIds.split(',').filter((e: string) => e!='').forEach( (element: string) => {
                    layers.add(element);
                });

                log.info("launching export...")
                Exporter.getInstance().on('ready', (exporter: Exporter) => {                  
                    exporter.export(mxf.xml, {
                        scale: 1,
                        crop: opts.crop,
                        format: opts.format,
                        sheet: sheetIndex,
                        layers: Array(...layers),
                        options: {
                            transparent: true,
                        }
                    }).then( (res: ExportResult) => {
                        log.info(`export size ${res.buffer.byteLength}B`)
                        fs.writeFile(`./${sheetName}.${opts.format}`, res.buffer, () => {
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