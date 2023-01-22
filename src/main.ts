import OpenAPIParser from '@readme/openapi-parser';
import { Logger } from '@flexbase/logger';
import { program } from 'commander';
import glob from 'glob';
import { OpenAPI } from 'openapi-types';
import Path from 'path';
import fs from 'fs-extra';
import prettier from 'prettier';
import { IsDocument } from './utilities/openapi.utilities';
import { IOpenApiSpecBuilder } from './oas-tree/oas.builder.interface';
import { IOpenApiSpecConverter } from './oas-tree/oas.converter.interface';
import Handlebars, { referenceRegistrations } from './handlerbars';
import { IAstBuilder } from './ast/ast.builder.interface';
import { AstDocument } from './ast/nodes/ast.document';

async function writeOutput(
  astDocument: AstDocument,
  path: string,
  fileName: string,
  ext: string,
  template: string,
  usePrettier: boolean,
  debug: boolean,
  logger: Logger
) {
  if (debug) {
    const name = Path.join(path, `${fileName}.ast.json`);
    let json = JSON.stringify(astDocument);
    try {
      json = prettier.format(json, {
        semi: true,
        singleQuote: true,
        arrowParens: 'avoid',
        tabWidth: 2,
        useTabs: false,
        printWidth: 100,
        parser: 'json',
      });
      await fs.writeFile(name, json);
    } catch {
      await fs.writeFile(name, json);
    }
  }

  const context = { astDocument };

  (Handlebars.logger as any)['actualLogger'] = logger;

  const handlebarTemplate = Handlebars.compile(template);

  const rendered = handlebarTemplate(context);

  const runPrettier = (str: string): string => {
    try {
      return prettier.format(str, {
        semi: true,
        singleQuote: true,
        arrowParens: 'avoid',
        tabWidth: 2,
        useTabs: false,
        printWidth: 150,
        parser: ext === '.ts' ? 'typescript' : 'babel',
      });
    } catch (e) {
      logger.info(e);
      return str;
    }
  };

  const output = Path.join(path, `${fileName}${ext}`);

  await fs.writeFile(output, usePrettier ? runPrettier(rendered) : rendered, 'utf8');
}

export async function main(
  oasBuilder: IOpenApiSpecBuilder,
  oasConverter: IOpenApiSpecConverter,
  astBuilder: IAstBuilder,
  logger: Logger
): Promise<void> {
  program
    .requiredOption('-i, --input <path>', 'OpenAPI spec to parse (*.json, *.yaml)')
    .requiredOption('-t, --template <path>', 'The template to use')
    .option('-n, --name <name>', 'The output file name to use. Defaults to the title of the spec. This will be ignored if tags are enabled')
    .option('-e, --ext <ext>', 'The file extension to use. Defaults to .ts', '.ts')
    .option('-p, --partials <glob>', 'Optional partial templates to include')
    .option('-o, --output <path>', 'An optional output path')
    .option('--no-prettier', 'Disable prettier for output')
    .option('--no-tags', 'Disable organization by tags')
    .option('--no-flatten', 'Disable flatten model optimization')
    .option('--no-references', 'Resolve all references')
    .option('-d, --debug', 'Output the internal representations')
    .parse(process.argv);

  const cliOptions = program.opts();

  try {
    const openApiDoc: OpenAPI.Document = await OpenAPIParser.parse(cliOptions.input);
    const apiDoc = openApiDoc; //await OpenAPIParser.dereference(openApiDoc);

    if (!IsDocument(apiDoc)) {
      logger.error('Not an open api v3 spec, stopping');
      process.exit();
    }

    const oasTree = oasBuilder.generateOasTree(apiDoc);

    // move operation declarations to lookups and replace with references
    oasBuilder.makeOperationDeclarationsGlobal(oasTree);

    const astDocument = astBuilder.makeDocument(oasTree);

    await fs.ensureDir(cliOptions.output);

    const tempExt = (cliOptions.ext as string) ?? 'ts';

    const ext: string = tempExt.startsWith('.') ? tempExt : `.${tempExt}`;
    const debug = cliOptions.debug;
    const path = cliOptions.output;

    if (debug) {
      const fileName = Path.join(path, `${oasTree.title}.oasTree.json`);
      let json = JSON.stringify(oasConverter.convertOasToPoco(oasTree));
      try {
        json = prettier.format(json, {
          semi: true,
          singleQuote: true,
          arrowParens: 'avoid',
          tabWidth: 2,
          useTabs: false,
          printWidth: 100,
          parser: 'json',
        });
        await fs.writeFile(fileName, json);
      } catch {
        await fs.writeFile(fileName, json);
      }
    }

    const template = await fs.readFile(cliOptions.template, 'utf8');
    if (cliOptions.partials) {
      glob.sync(cliOptions.partials).forEach(file => {
        const name = Path.basename(file);
        const ext = Path.extname(name);
        Handlebars.registerPartial(name.replace(ext, ''), fs.readFileSync(file, 'utf8'));
      });
    }

    const documents: AstDocument[] = cliOptions.tags ? astBuilder.organizeByTags(astDocument) : [astDocument];
    const name: string | undefined = cliOptions.tags ? cliOptions.name : undefined;

    for (const doc of documents) {
      if (cliOptions.flatten) {
        astBuilder.flattenReferences(doc, !cliOptions.references);
      }
      astBuilder.removeUnreferencedModels(doc);
      referenceRegistrations.clear();
      await writeOutput(doc, path, name ?? doc.title, ext, template, cliOptions.prettier, debug, logger);
    }
  } catch (e) {
    logger.error(`An error occurred for ${cliOptions.input}`, e);
    process.exit();
  }
}
