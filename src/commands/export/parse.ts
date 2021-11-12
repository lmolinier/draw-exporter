import { Command, OptionValues } from "commander";
import { Diagram, MxFile } from "../../diagram";
import { ExportParams } from "../../exporter";

function resolveSheet(mxf: MxFile, opts: OptionValues): Diagram {
  // Either (first is prioritary):
  // - the `opts.sheet` is given and we simply try to resolve the index
  // - the `opts.sheetIndex` is given in the command-line lookup for the name
  let name: string = opts.sheet;
  if (opts.sheet) {
    return mxf.diagrams.get(opts.sheet);
  } else {
    let index: number = Number(opts.sheetIndex);
    let sheet: Diagram;
    mxf.diagrams.forEach((d: Diagram) => {
      if (d.index == index) {
        sheet = d;
      }
    });
    return sheet;
  }
}

function resolveLayers(
  mxf: MxFile,
  sheet: Diagram,
  opts: OptionValues
): Set<string> {
  let layers = new Set<string>();

  // Lookup from layer names provided in '--layers'
  opts.layers
    .split(",")
    .filter((e: string) => e != "")
    .forEach((element: string) => {
      if (sheet.layers.has(element)) {
        layers.add(sheet.layers.get(element).id);
      }
    });

  // Add layer from '--layer-ids'
  opts.layerIds
    .split(",")
    .filter((e: string) => e != "")
    .forEach((element: string) => {
      layers.add(element);
    });

  return layers;
}

export class ParseOptions {
  static with(cmd: Command): Command {
    return cmd
      .option(
        "-s, --sheet <name>",
        "select sheet to print by its name (default: first)",
        null
      )
      .option(
        "--sheet-index <number>",
        "select sheet by it index (if --sheet is not set)",
        "0"
      )

      .option(
        "-l, --layers <layers>",
        "comma separated list of layers names to export (default: current view)",
        ""
      )
      .option(
        "--layer-ids <layer-ids>",
        "comma separated list of layers ID to export (default: current view)",
        ""
      );
  }

  static prepare(
    mxf: MxFile,
    opts: OptionValues,
    params: ExportParams
  ): ExportParams {
    const sheet = resolveSheet(mxf, opts);
    if (sheet === undefined) {
      throw Error(
        "cannot find the sheet given the '--sheet' (or '--sheet-index')."
      );
    }
    const layers = resolveLayers(mxf, sheet, opts);

    params.sheet = sheet.index;
    params.layers = Array(...layers);
    return params;
  }
}
