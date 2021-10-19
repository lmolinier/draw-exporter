import { Command, OptionValues } from "commander";
import { SetupLogging, WithLoggingOptions } from "../logging";
import { MxFile, Diagram, Layer } from "../diagram";

export function layersCommand(cli: Command) {
    WithLoggingOptions(cli.command("layers <input-file> <sheet>")
        .description("List all layers available in the sheet")
    )
    .action(function(inFile: string, sheet: string, opts: OptionValues) {
        SetupLogging(opts);
        return new Promise<void>((resolve, reject) => {
            var mxf = new MxFile(inFile);
            mxf.parse().then((content: any) => {
                mxf.diagrams.get(sheet).layers.forEach( (l: Layer) => {
                    console.log(`${l.id}: ${l.name}`);
                    if(opts.verbose) {
                        console.log(`  visible: ${l.visible}`);
                    }
                });
                resolve();
            }).catch((err: Error) => {
                reject(err);
            });
        });
    });
}