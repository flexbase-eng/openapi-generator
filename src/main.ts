import { Logger } from '@flexbase/logger';
import { program } from 'commander';
import * as glob from 'glob';
import Path from 'path';
import fs from 'fs-extra';
import { IOpenApiSpecBuilder } from './oas-tree/oas.builder.interface';
import { IOpenApiSpecConverter } from './oas-tree/oas.converter.interface';
import { IAstBuilder } from './ast/ast.builder.interface';
import { AstDocument } from './ast/nodes/ast.document';
import pkg from '../package.json' assert { type: 'json' };
import { OpenApiGeneratorConfiguation } from './runtime.config';
import { build } from './build';
import { parseSpec } from './parse';

export async function main(
  oasBuilder: IOpenApiSpecBuilder,
  oasConverter: IOpenApiSpecConverter,
  astBuilder: IAstBuilder,
  logger: Logger,
): Promise<void> {
  program.name(pkg.name).description(pkg.description).version(pkg.version);

  let config: OpenApiGeneratorConfiguation = {
    include: [],
    prettier: true,
    tags: true,
    flatten: true,
    references: true,
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
    .option('--no-flatten', 'Disable flatten model optimization')
    .option('--no-references', 'Resolve all references')
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
      if (options.flatten != undefined) config.flatten = options.flatten;
      if (options.prettier != undefined) config.prettier = options.prettier;
      if (options.references != undefined) config.references = options.references;
      if (options.skipEmpty != undefined) config.skipEmpty = options.skipEmpty;
    });

  try {
    program.parse(process.argv);

    const astList: AstDocument[] = [];

    const globInput = glob.sync(config.include);
    for (const specPath of globInput) {
      try {
        const ast = await parseSpec(config, specPath, oasBuilder, oasConverter, astBuilder, logger);
        astList.push(ast);
      } catch (e) {
        logger.error(e);
      }
    }

    for (const ast of astList) {
      try {
        await build(config, ast, astBuilder, logger);
      } catch (e) {
        logger.error(e);
      }
    }
  } catch (e) {
    logger.error(e);
  }
  return;
}
