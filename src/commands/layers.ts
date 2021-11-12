import {Command, OptionValues} from 'commander';
import {setupLogging, withLoggingOptions} from '../logging';
import {MxFile, Layer} from '../diagram';

export function layersCommand(cli: Command) {
  withLoggingOptions(
      cli
          .command('layers <input-file> <sheet>')
          .description('List all layers available in the sheet'),
  ).action(function(inFile: string, sheet: string, opts: OptionValues) {
    setupLogging(opts);
    return new Promise<void>((resolve, reject) => {
      const mxf = new MxFile(inFile);
      mxf
          .parse()
          .then((content: any) => {
            mxf.diagrams.get(sheet).layers.forEach((l: Layer) => {
              console.log(`${l.id}: ${l.name}`);
              if (opts.verbose) {
                console.log(`  visible: ${l.visible}`);
              }
            });
            resolve();
          })
          .catch((err: Error) => {
            reject(err);
          });
    });
  });
}
