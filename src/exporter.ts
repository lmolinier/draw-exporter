import { app, BrowserWindow, ipcMain } from 'electron';
import * as events from 'events';
import * as path from 'path';

const MICRON_TO_PIXEL = 264.58 		//264.58 micron = 1 pixel

class RenderInfo {
  pageCount: number
  bounds?: {
    x: number
    y: number
    width: number
    height: number
  }
} 

export class ExportParams {
  scale: number | 'auto' | null;
  crop: boolean;
  format: 'pdf' | 'xml';
  sheet: number;
}

export class ExportResult {
  buffer: Buffer
}

export class Exporter extends events.EventEmitter {
  private static instance: Exporter;

  // Create the browser window.
  _browser: BrowserWindow = null;

  /**
   * The static method that controls the access to the exporter instance.
   */
  public static getInstance(): Exporter {
      if (!Exporter.instance) {
          Exporter.instance = new Exporter();
      }
      return Exporter.instance;
  }

  public set browser(b: BrowserWindow) {
      this._browser = b;
      b.webContents
        .on('did-finish-load', () => {
          this.emit('ready', this);
        })
        .on('console-message', (event: Electron.Event, level: number, message: string, line: number, sourceId: string) => {
          console.log(`[${level}] ${message} ${sourceId} (${line})`);
        });
  }

  public get browser() {
    return this._browser;
  }

  public export(xmlData: string, params: ExportParams): Promise<ExportResult> {
    return new Promise<ExportResult>((resolve, reject) => {
      console.log("calling export")
      ipcMain
      /*.once('export-finalize', (event: Electron.IpcMainEvent) => {
        console.log("export-finalize")
        resolve(null);
      })*/
      /*.once('xml-data', () => {
        console.log("xml-data")
      })
      .once('xml-data-error', () => {
        console.log("xml-data-error")
      })*/
      .once('render-finished', (event: Electron.IpcMainEvent, renderInfo: any) => {
        var ri: RenderInfo = {
          pageCount: renderInfo.pageCount,
          bounds: null,
        }
        
        //For some reason, Electron 9 doesn't send this object as is without stringifying. Usually when variable is external to function own scope
				try {
					ri.bounds = JSON.parse(renderInfo.bounds);
				}
				catch(e) {}

        console.log("renderInfo");
        console.log(ri);

        if (ri.bounds == null || ri.bounds.width < 5 || ri.bounds.height < 5) {
          //A workaround to detect errors in the input file or being empty file
          reject('input file is empty or contains errors');
          return;
        }

        var p: Promise<Buffer>
        switch(params.format) {
          case 'pdf':
            p = this._exportPdf(params, ri);
            break;
          default:
            reject(`Invalid format: ${params.format}`);
            return;
        }

        p.then((b: Buffer) => {
          resolve({
            buffer: b,
          })
        }).catch( (reason: any) => {
          reject(reason);
        });
      });

      /* Let's go and ask for the rendering */
      console.log(params);
      var p: any = {
        xml: xmlData, // put the xmlData inside the structure
        scale: (params.crop && (params.scale == null || params.scale == 1)) ? 1.00001: (params.scale || 1),
        format: params.format,
        from: params.sheet,
        to: params.sheet,
      };
      this._browser.webContents.send('render', p);
    });
  }

  _exportPdf(params: ExportParams, ri: RenderInfo): Promise<Buffer> {    
    // Chrome generates Pdf files larger than requested pixels size and requires scaling
    var fixingScale = 0.959;

    var w = Math.ceil(ri.bounds.width * fixingScale);
    
    // +0.1 fixes cases where adding 1px below is not enough
    // Increase this if more cropped PDFs have extra empty pages
    var h = Math.ceil(ri.bounds.height * fixingScale + 0.1);
    
    var pdfOptions: Electron.PrintToPDFOptions = {
      printBackground: true,
      pageSize : {
        width: w * MICRON_TO_PIXEL,
        height: (h + 2) * MICRON_TO_PIXEL //the extra 2 pixels to prevent adding an extra empty page						
      },
      marginsType: 1 // no margin
    }
    
    return this.browser.webContents.printToPDF(pdfOptions);
  }

  _renderFinishedHandler(event: Electron.IpcMainEvent, renderInfo: any) {
    console.log("renderInfo");
    console.log(renderInfo);
  }

  /*
  function renderingFinishHandler(evt, renderInfo)
			{
				var pageCount = renderInfo.pageCount, bounds = null;
				//For some reason, Electron 9 doesn't send this object as is without stringifying. Usually when variable is external to function own scope
				try
				{
					bounds = JSON.parse(renderInfo.bounds);
				}
				catch(e)
				{
					bounds = null;
				}
				
				var pdfOptions = {pageSize: 'A4'};
				var hasError = false;
				
				if (bounds == null || bounds.width < 5 || bounds.height < 5) //very small page size never return from printToPDF
				{
					//A workaround to detect errors in the input file or being empty file
					hasError = true;
				}
				else
				{
					//Chrome generates Pdf files larger than requested pixels size and requires scaling
					var fixingScale = 0.959;
	
					var w = Math.ceil(bounds.width * fixingScale);
					
					// +0.1 fixes cases where adding 1px below is not enough
					// Increase this if more cropped PDFs have extra empty pages
					var h = Math.ceil(bounds.height * fixingScale + 0.1);
					
					pdfOptions = {
						printBackground: true,
						pageSize : {
							width: w * MICRON_TO_PIXEL,
							height: (h + 2) * MICRON_TO_PIXEL //the extra 2 pixels to prevent adding an extra empty page						
						},
						marginsType: 1 // no margin
					}
				}
				
				var base64encoded = args.base64 == '1';
				
				if (hasError)
				{
					event.reply('export-error');
				}
				else if (args.format == 'png' || args.format == 'jpg' || args.format == 'jpeg')
				{
					//Adds an extra pixel to prevent scrollbars from showing
					var newBounds = {width: Math.ceil(bounds.width + bounds.x) + 1, height: Math.ceil(bounds.height + bounds.y) + 1};
					browser.setBounds(newBounds);
					
					//TODO The browser takes sometime to show the graph (also after resize it takes some time to render)
					//	 	1 sec is most probably enough (for small images, 5 for large ones) BUT not a stable solution
					setTimeout(function()
					{
						browser.capturePage().then(function(img)
						{
							//Image is double the given bounds, so resize is needed!
							var tScale = 1;

							//If user defined width and/or height, enforce it precisely here. Height override width
							if (args.h)
							{
								tScale = args.h / newBounds.height;
							}
							else if (args.w)
							{
								tScale = args.w / newBounds.width;
							}
							
							newBounds.width *= tScale;
							newBounds.height *= tScale;
							img = img.resize(newBounds);

							var data = args.format == 'png'? img.toPNG() : img.toJPEG(args.jpegQuality || 90);
							
							if (args.dpi != null && args.format == 'png')
							{
								data = writePngWithText(data, 'dpi', args.dpi);
							}
							
							if (args.embedXml == "1" && args.format == 'png')
							{
								data = writePngWithText(data, "mxGraphModel", args.xml, true,
										base64encoded);
							}
							else
							{
								if (base64encoded)
								{
									data = data.toString('base64');
								}
							}
							
							event.reply('export-success', data);
						});
					}, bounds.width * bounds.height < LARGE_IMAGE_AREA? 1000 : 5000);
				}
				else if (args.format == 'pdf')
				{
					if (args.print)
					{
						pdfOptions = {
							scaleFactor: args.pageScale,
							printBackground: true,
							pageSize : {
								width: args.pageWidth * MICRON_TO_PIXEL,
								//This height adjustment fixes the output. TODO Test more cases
								height: (args.pageHeight * 1.025) * MICRON_TO_PIXEL
							},
							marginsType: 1 // no margin
						};
						 
						contents.print(pdfOptions, (success, errorType) => 
						{
							//Consider all as success
							event.reply('export-success', {});
						});
					}
					else
					{
						contents.printToPDF(pdfOptions).then(async (data) => 
						{
							pdfs.push(data);
							to = to > pageCount? pageCount : to;
							from++;
							
							if (from < to)
							{
								args.from = from;
								args.to = from;
								ipcMain.once('render-finished', renderingFinishHandler);
								contents.send('render', args);
							}
							else
							{
								data = await mergePdfs(pdfs, args.embedXml == '1' ? args.xml : null);
								event.reply('export-success', data);
							}
						})
						.catch((error) => 
						{
							event.reply('export-error', error);
						});
					}
				}
				else if (args.format == 'svg')
				{
					contents.send('get-svg-data');
					
					ipcMain.once('svg-data', (evt, data) =>
					{
						event.reply('export-success', data);
					});
				}
				else
				{
					event.reply('export-error', 'Error: Unsupported format');
				}
			};
      */

}