import { Command, OptionValues } from "commander";
import { MxFile } from "../../diagram";
import { ExportParams } from "../../exporter";

export class CommonOptions {
  static with(cmd: Command): Command {
    return cmd
      .option("--no-crop", "do not crop to content")
      .option("--scale <scale>", "scale factor at export", "1");
  }

  static prepare(
    mxf: MxFile,
    opts: OptionValues,
    params: ExportParams
  ): ExportParams {
    params.scale = Number(opts.scale);
    params.crop = opts.crop;
    return params;
  }
}
