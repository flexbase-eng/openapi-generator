import { Logger } from '@flexbase/logger';
import { program } from 'commander';
import * as glob from 'glob';
import Path from 'path';
import fs from 'fs-extra';
import { IOpenApiSpecBuilder } from './oas-tree/oas.builder.interface';
import { IOpenApiSpecConverter } from './oas-tree/oas.converter.interface';
import Handlebars from './handlerbars';
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
  logger: Logger
): Promise<void> {
  program.name(pkg.name).description(pkg.description).version(pkg.version);

  let config: OpenApiGeneratorConfiguation = {
    include: [],
    target: '',
    template: '',
    prettier: true,
    tags: true,
    flatten: true,
    references: true,
    debug: false,
  };

  program
    .option('-d, --debug', 'Enable debug mode')
    .option('--include <glob>', 'Specifies the glob pattern for files to parse')
    .option('--target <path>', 'Specifies the target file')
    .option('--template <path>', 'Specifies the template to use for generation')
    .option('--sharedTemplates <glob>', 'Specifies the glob pattern for shared templates')
    .option('--config <file>', 'Specify a configuration to use', '.openapigenerator.json')
    .option('--no-prettier', 'Disable prettier')
    .option('--no-tags', 'Disable organization by tags')
    .option('--no-flatten', 'Disable flatten model optimization')
    .option('--no-references', 'Resolve all references')
    .action(options => {
      const fileConfig = fs.existsSync(options.config ?? '.openapigenerator.json')
        ? fs.readJsonSync(options.config ?? '.openapigenerator.json')
        : undefined;

      if (fileConfig) config = { ...fileConfig };

      if (options.include != undefined) config.include = Array.isArray(options.include) ? options.include : [options.include];
      if (options.target != undefined) config.target = options.target;
      if (options.template != undefined) config.template = options.template;
      if (options.debug != undefined) config.debug = options.debug;
      if (options.sharedTemplates != undefined)
        config.sharedTemplates = Array.isArray(options.sharedTemplates) ? options.sharedTemplates : [options.sharedTemplates];
      if (options.tags != undefined) config.tags = options.tags;
      if (options.flatten != undefined) config.flatten = options.flatten;
      if (options.prettier != undefined) config.prettier = options.prettier;
      if (options.references != undefined) config.references = options.references;
    });

  try {
    (Handlebars.logger as any)['actualLogger'] = logger;

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

    const globTemplates = glob.sync(config.sharedTemplates ?? '');
    for (const file of globTemplates) {
      const name = Path.basename(file);
      const ext = Path.extname(name);
      Handlebars.registerPartial(name.replace(ext, ''), fs.readFileSync(file, 'utf8'));
    }

    for (const ast of astList) {
      try {
        await build(config, ast, astBuilder, logger);
      } catch (e) {
        logger.error(e);
      }
    }
  } catch (e) {
    console.error(e);
  }
  return;
}
