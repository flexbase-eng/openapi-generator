import { Logger } from '@flexbase-eng/logger';
import { program } from 'commander';
import * as glob from 'glob';
import Path from 'path';
import fs from 'fs-extra';
import pkg from '../package.json' assert { type: 'json' };
import { OpenApiGeneratorConfiguation } from './runtime.config.js';
import { build } from './build.js';
import { parseSpec } from './parse.js';

export async function main(logger: Logger): Promise<void> {
  program.name(pkg.name).description(pkg.description).version(pkg.version);

  let config: OpenApiGeneratorConfiguation = {
    include: [],
    prettier: true,
    tags: true,
    debug: false,
    debugPath: '',
    skipEmpty: true,
  };

  program
    .option('-d, --debug [path]', 'Enable debug mode with optional output path')
    .option('--include <glob>', 'Specifies the glob pattern for files to parse')
    .option('--sharedTemplates <glob>', 'Specifies the glob pattern for shared templates')
    .option('--config <file>', 'Specify a configuration to use', '.openapigenerator.json')
    .option('--no-prettier', 'Disable prettier')
    .option('--no-tags', 'Disable organization by tags')
    .option('--no-skipempty', 'Generate empty files')
    .action(options => {
      const fileConfig = fs.existsSync(options.config ?? '.openapigenerator.json')
        ? fs.readJsonSync(options.config ?? '.openapigenerator.json')
        : undefined;

      if (fileConfig) {
        process.chdir(Path.dirname(options.config));
        config = { ...config, ...fileConfig };
      }

      if (options.include != undefined) config.include = Array.isArray(options.include) ? options.include : [options.include];
      if (options.debug != undefined) {
        if (typeof options.debug === 'string') config.debugPath = options.debug;
        config.debug = true;
      }
      if (options.sharedTemplates != undefined)
        config.sharedTemplates = Array.isArray(options.sharedTemplates) ? options.sharedTemplates : [options.sharedTemplates];
      if (options.tags != undefined) config.tags = options.tags;
      if (options.prettier != undefined) config.prettier = options.prettier;
      if (options.skipEmpty != undefined) config.skipEmpty = options.skipEmpty;
    });

  try {
    program.parse(process.argv);

    const globInput = glob.sync(config.include);

    for (const specPath of globInput) {
      try {
        const parsedDocument = await parseSpec(specPath, logger);
        await build(config, parsedDocument, logger);
      } catch (e) {
        logger.error(e);
      }
    }
  } catch (e) {
    logger.error(e);
  }
}
