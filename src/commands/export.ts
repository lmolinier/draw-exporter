import {Command, OptionValues} from 'commander';
import {Exporter, ExportResult} from '../exporter';
import {MxFile, Diagram} from '../diagram';
import * as fs from 'fs';
import {setupLogging, withLoggingOptions} from '../logging';
import {Category} from 'typescript-logging';

const log = new Category('export');

export function exportCommand(cli: Command) {
  withLoggingOptions(cli.command('export <input-file> <output-file>')
      .description('Export diagram'),
  )
      .option('-f, --format <extension>', 'export format (pdf, png, svg)', 'pdf')
      .option('-c, --crop', 'crop to content', true)

      .option('-s, --sheet <name>', 'select sheet to print by its name (default: first)', null)
      .option('--sheet-index <number>', 'select sheet by it index (if --sheet is not set)', '0')

      .option('-l, --layers <layers>', 'comma separated list of layers names to export (default: current view)', '')
      .option('--layer-ids <layer-ids>', 'comma separated list of layers ID to export (default: current view)', '')

      .action(function(inFile: string, outFile: string, opts: OptionValues) {
        setupLogging(opts);
        return new Promise<void>((resolve, reject) => {
          const mxf = new MxFile(inFile);
          mxf.parse().then((content: any) => {
            // Get sheet-index given the sheet
            let sheetIndex: number = Number(opts.sheetIndex);
            let sheetName: string = opts.sheet;
            if (opts.sheet) {
              sheetIndex = mxf.diagrams.get(opts.sheet)?.index | 0;
            } else {
              mxf.diagrams.forEach((d: Diagram) => {
                if (d.index == sheetIndex) {
                  sheetName = d.name;
                }
              });
            }

            const layers = new Set<string>();
            opts.layers.split(',').filter((e: string) => e!='').forEach( (element: string) => {
              if (mxf.diagrams.get(sheetName).layers.has(element)) {
                layers.add(mxf.diagrams.get(sheetName).layers.get(element).id);
              }
            });
            opts.layerIds.split(',').filter((e: string) => e!='').forEach( (element: string) => {
              layers.add(element);
            });

            log.info('launching export...');
            Exporter.getInstance().on('ready', (exporter: Exporter) => {
              exporter.export(mxf.xml, {
                scale: 1,
                crop: opts.crop,
                format: opts.format,
                sheet: sheetIndex,
                layers: Array(...layers),
                options: {
                  transparent: true,
                },
              }).then( (res: ExportResult) => {
                log.info(`export size ${res.buffer.byteLength}B`);
                if (outFile == '-') {
                  fs.write(1, res.buffer, () => {
                    resolve();
                  });
                  return;
                }
                fs.writeFile(outFile, res.buffer, () => {
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
