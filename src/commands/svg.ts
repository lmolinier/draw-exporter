import {Command, OptionValues} from 'commander';
import {ExportParams} from '../exporter';
import {MxFile} from '../diagram';
import {setupLogging, withLoggingOptions} from '../logging';
import {CommonOptions} from './export/common';
import {ParseOptions} from './export/parse';
import {doExport} from './export/utils';

export function exportSvgCommand(cli: Command) {
  withLoggingOptions(
      CommonOptions.with(
          ParseOptions.with(
              cli
                  .command('svg <input-file> <output-file>')
                  .description('SVG Export diagram'),
          ),
      ),
  ).action(function(inFile: string, outFile: string, opts: OptionValues) {
    setupLogging(opts);
    return new Promise<void>((resolve, reject) => {
      const mxf = new MxFile(inFile);
      mxf.parse().then((content: any) => {
        const params: ExportParams = {
          scale: undefined,
          crop: undefined,
          format: 'svg',
          sheet: undefined,
          layers: [],
          options: undefined,
        };

        try {
          ParseOptions.prepare(mxf, opts, params);
          CommonOptions.prepare(mxf, opts, params);
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
      });
    });
  });
}
