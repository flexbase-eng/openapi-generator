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
import Handlebars from './handlerbars';
import { IAstBuilder } from './ast/ast.builder.interface';

export async function main(
  oasBuilder: IOpenApiSpecBuilder,
  oasConverter: IOpenApiSpecConverter,
  astBuilder: IAstBuilder,
  logger: Logger
): Promise<void> {
  program
    .requiredOption('-i, --input <path>', 'OpenAPI spec to parse (*.json, *.yaml)')
    .requiredOption('-t, --template <path>', 'The template to use')
    .option('-n, --name <name>', 'The output file name to use. Defaults to the title of the spec')
    .option('-e, --ext <ext>', 'The file extension to use. Defaults to .ts', '.ts')
    .option('-p, --partials <glob>', 'Optional partial templates to include')
    .option('-o, --output <path>', 'An optional output path')
    .option('--no-prettier', 'Disable prettier for output', true)
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

    const name = cliOptions.name ?? oasTree.title;
    //const name = name.replace(/-./g, x => x[1].toUpperCase());

    const fileName = `${name}${cliOptions.ext ?? '.ts'}`;

    await fs.ensureDir(cliOptions.output);
    const output = Path.join(cliOptions.output, fileName);
    const template = await fs.readFile(cliOptions.template, 'utf8');
    if (cliOptions.partials) {
      glob.sync(cliOptions.partials).forEach(file => {
        const name = Path.basename(file);
        const ext = Path.extname(name);
        Handlebars.registerPartial(name.replace(ext, ''), fs.readFileSync(file, 'utf8'));
      });
    }

    if (cliOptions.debug) {
      const name = Path.join(cliOptions.output, `${fileName}.ast.json`);
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

    const jsonOas = oasConverter.convertOasToPoco(oasTree);
    if (cliOptions.debug) {
      const name = Path.join(cliOptions.output, `${fileName}.oasTree.json`);
      let json = JSON.stringify(jsonOas);
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
          parser: 'typescript',
        });
      } catch (e) {
        logger.info(e);
        return str;
      }
    };

    await fs.writeFile(output, cliOptions.prettier ? runPrettier(rendered) : rendered, 'utf8');
  } catch (e) {
    logger.error(`An error occurred ${cliOptions.input}`, e);
    process.exit();
  }
}
