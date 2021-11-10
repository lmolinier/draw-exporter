import {Command, OptionValues} from 'commander';
import {setupLogging, withLoggingOptions} from '../logging';
import {MxFile, Diagram} from '../diagram';

export function sheetsCommand(cli: Command) {
  withLoggingOptions(cli.command('sheets <input-file>')
      .description('List all sheets available in the file'),
  )
      .action(function(inFile: string, opts: OptionValues) {
        setupLogging(opts);
        return new Promise<void>((resolve, reject) => {
          const mxf = new MxFile(inFile);
          mxf.parse().then((content: any) => {
            mxf.diagrams?.forEach((d: Diagram) => {
              console.log(`${d.index}: ${d.name}`);
              if (opts.verbose) {
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
