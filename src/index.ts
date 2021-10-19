import { app } from 'electron';

import * as path from 'path';
import { OptionValues, program } from 'commander';
import { sheetsCommand } from './commands/sheets';
import { layersCommand } from './commands/layers';
import { exportCommand } from './commands/export';
import { Exporter } from './exporter';

async function main(): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const cli = program
      .name("draw-exporter")
      .action(function(inFile: string, opts: OptionValues) {
        console.log(opts);
      })
      .version(app.getVersion());

    sheetsCommand(cli);
    layersCommand(cli);
    exportCommand(cli);

    cli.parseAsync().then(() => {
      resolve(0);
    }).catch((reason: any) => {
      console.log(`error: ${reason}`);
      resolve(1);
    }); 
  });
}

main().then((code: number) => {
  Exporter.exit();
  process.exit(code)
});
