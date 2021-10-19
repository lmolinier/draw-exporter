import { app, BrowserWindow } from 'electron';

import * as path from 'path';
import { OptionValues, program } from 'commander';
import { sheetsCommand } from './commands/sheets';
import { layersCommand } from './commands/layers';
import { exportCommand } from './commands/export';
import { Exporter } from './exporter';

// Create the browser window.
var browser: BrowserWindow = null

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
  if(browser != null) {
    browser.close();
  }
  process.exit(code)
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', (event: Electron.Event) => {
  try {
    var debug = false;
    browser = new BrowserWindow({
      webPreferences: {
        backgroundThrottling: false,
        nodeIntegration: true,
        contextIsolation: false,
        nativeWindowOpen: true
      },
      show: debug,
      frame: false,
      enableLargerThanScreen: true,
    });

    if(debug) {
      browser.webContents.openDevTools()
    }

    // and load the export3.html of draw.io app.
    browser.loadFile(path.join(__dirname, '../drawio/src/main/webapp/export3.html'));

    // set the browser instance in the exporter singleton
    Exporter.getInstance().browser = browser;
  } catch(e) {
    if(browser != null)
      browser.close()
    console.error("error loading electron browser: ", e);
    process.exit(1);
  }
});

