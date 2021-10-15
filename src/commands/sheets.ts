import { Command, OptionValues } from "commander";
import { MxFile, Diagram } from "../diagram";

export function sheetsCommand(cli: Command) {
    cli.command("sheets <input-file>")
    .description("List all sheets available in the file")
    .option("-v, --verbose", "verbose output", false)
    .option("-t, --trace", "enable traces", false)
    .action(function(inFile: string, opts: OptionValues) {
        return new Promise<void>((resolve, reject) => {
            var mxf = new MxFile(inFile);
            mxf.parse().then((content: any) => {
                if(opts.trace) {
                    console.error("XML content:");
                    console.error(content);
                }

                mxf.diagrams?.forEach((d: Diagram) => {
                console.log(`${d.index}: ${d.name}`);
                if(opts.verbose) {
                    console.log(`  id: ${d.id}`);
                }
                });
                resolve();
            }).catch((err: Error) => {
                reject(err);
            });
        });
    });
}