import OpenAPIParser from '@readme/openapi-parser';
import chalk from 'chalk';
import { program } from 'commander';
import glob from 'glob';
import Mustache from 'mustache';
import { OpenAPI } from 'openapi-types';
import { AstContext } from './ast.context';
import Path from 'path';
import fs from 'fs-extra';
import prettier from 'prettier';
import { convertAstToPoco, createDeclarationMappings, generateAst, makeOperationDeclarationsGlobal } from './ast/ast.builder';
import { IsDocument } from './utilities/openapi.utilities';

type renderFunction = (text: string) => string;

export async function main(): Promise<void> {
  program
    .requiredOption('-i, --input <path>', 'OpenAPI spec to parse (*.json, *.yaml)')
    .requiredOption('-t, --template <path>', 'The template to use')
    .option('-n, --name <name>', 'The output file name to use. Defaults to the title of the spec')
    .option('-e, --ext <ext>', 'The file extension to use. Defaults to .ts', '.ts')
    .option('-p, --partials <glob>', 'Optional partial templates to include')
    .option('-o, --output <path>', 'An optional output path')
    .option('-d, --debug', 'Output the internal ast representation')
    .parse(process.argv);

  const cliOptions = program.opts();

  try {
    const openApiDoc: OpenAPI.Document = await OpenAPIParser.parse(cliOptions.input);
    const apiDoc = openApiDoc; //await OpenAPIParser.dereference(openApiDoc);

    if (!IsDocument(apiDoc)) {
      console.log(chalk.red('Not an open api v3 spec, stopping'));
      process.exit();
    }

    const ast = generateAst(apiDoc);

    // move operation declarations to lookups and replace with references
    makeOperationDeclarationsGlobal(ast);

    const declarationLookups = createDeclarationMappings(ast.declarations);

    const functions = {
      declarationLookup: function () {
        return function (text: string, render: any) {
          const rendered = render(text);
          const model = declarationLookups.get(rendered);
          if (model) {
            return model.generatedIdentifier.value;
          } else {
            console.warn(`declaration lookup unable to find ${rendered}`);
          }
          return rendered;
        };
      },
      removeNewLines: function () {
        return function (text: string, render: any) {
          const rendered = render(text);
          return rendered.replace(/(\r\n|\n|\r)/gm, '');
        };
      },
      commentSection: function () {
        return function (text: string, render: renderFunction) {
          const rendered: string = render(text).trim();
          if (rendered.length > 0) {
            return '\n/**\n' + rendered.replace(/(\r\n|\n|\r){2,}/gm, '\n') + '\n*/\n';
          }
          return rendered;
        };
      },
      joinTypes: function () {
        return function (text: string, render: renderFunction, args?: string) {
          const rendered: string = render(text).trim();
          if (args && rendered.endsWith(args)) {
            return rendered.slice(0, -args.length);
          }
          return rendered;
        };
      },
      formatPath: function () {
        return function (text: string, render: renderFunction) {
          return render(text).replace(/{(\w+)}/g, ':$1');
        };
      },
    };

    if (cliOptions.name) {
      ast.name = cliOptions.name;
    }

    const fileName = `${ast.name}${cliOptions.ext ?? '.ts'}`;

    await fs.ensureDir(cliOptions.output);
    const output = Path.join(cliOptions.output, fileName);
    const template = await fs.readFile(cliOptions.template, 'utf8');
    const partials: Record<string, string> = {};

    if (cliOptions.partials) {
      glob.sync(cliOptions.partials).forEach(file => {
        const name = Path.basename(file);
        const ext = Path.extname(name);
        partials[name.replace(ext, '')] = fs.readFileSync(file, 'utf8');
      });
    }

    const jsonAst = convertAstToPoco(ast);

    const context = new AstContext({ ast: jsonAst, functions });

    if (cliOptions.debug) {
      const name = Path.join(cliOptions.output, `${fileName}.ast.json`);
      let json = JSON.stringify(jsonAst);
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

    const rendered = Mustache.render(template, context, partials);

    try {
      await fs.writeFile(
        output,
        prettier.format(rendered, {
          semi: true,
          singleQuote: true,
          arrowParens: 'avoid',
          tabWidth: 4,
          useTabs: false,
          printWidth: 150,
          parser: 'typescript',
        }),
        'utf8'
      );
    } catch {
      await fs.writeFile(output, rendered, 'utf8');
    }
  } catch (e) {
    console.log(chalk.red(`An error occurred ${cliOptions.input}`), e);
    process.exit();
  }
}
