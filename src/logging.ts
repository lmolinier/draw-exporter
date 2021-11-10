import { Command, OptionValues } from "commander";
import {
  CategoryServiceFactory,
  CategoryConfiguration,
  LogLevel,
  Category,
} from "typescript-logging";

const log = new Category("root");

export function withLoggingOptions(cmd: Command): Command {
  return cmd
    .option("-v, --verbose", "verbose output", false)
    .option("-t, --trace", "enable traces", false);
}

export function setupLogging(opts: OptionValues): OptionValues {
  if (opts.verbose) {
    CategoryServiceFactory.setDefaultConfiguration(
      new CategoryConfiguration(LogLevel.Debug)
    );
  }
  if (opts.trace) {
    CategoryServiceFactory.setDefaultConfiguration(
      new CategoryConfiguration(LogLevel.Trace)
    );
  }
  log.trace(`options: ${JSON.stringify(opts)}`);
  return opts;
}

// Create categories, they will autoregister themselves, one category without parent (root) and a child category.
//export const catService = new Category("service");
