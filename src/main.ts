import { FileInfo, ResolverOptions } from '@readme/openapi-parser';
import { Logger } from '@flexbase/logger';
import { program } from 'commander';
import * as glob from 'glob';
import Path from 'path';
import fs from 'fs-extra';
import prettier, { BuiltInParserName } from 'prettier';
import { IsDocument } from './utilities/openapi.utilities';
import { IOpenApiSpecBuilder } from './oas-tree/oas.builder.interface';
import { IOpenApiSpecConverter } from './oas-tree/oas.converter.interface';
import Handlebars, { referenceRegistrations } from './handlerbars';
import { IAstBuilder } from './ast/ast.builder.interface';
import { AstDocument } from './ast/nodes/ast.document';
import $RefParser from '@stoplight/json-schema-ref-parser';
import pkg from '../package.json' assert { type: 'json' };
import { OpenApiGeneratorConfiguation } from './runtime.config';
import { build } from './build';

const runPrettier = (str: string, ext: BuiltInParserName): string => {
  return prettier.format(str, {
    semi: true,
    singleQuote: true,
    arrowParens: 'avoid',
    tabWidth: 2,
    useTabs: false,
    printWidth: 150,
    parser: ext,
  });
};

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

  const output = Path.join(path, `${fileName}${ext}`);

  await fs.writeFile(output, usePrettier ? runPrettier(rendered, ext === '.ts' ? 'typescript' : 'babel') : rendered, 'utf8');
}

class FileResolver implements ResolverOptions {
  constructor(private readonly _logger: Logger) {}

  get order() {
    return 0;
  }

  canRead(file: any) {
    const url = new URL(file.url);
    const protocol = url.protocol;
    return protocol === undefined || protocol === 'file';
  }

  async read(file: FileInfo) {
    const path = new URL(file.url);

    return await fs.readFile(path, 'utf8');
  }
}

const parseSpec = async (spec: string, oasBuilder: IOpenApiSpecBuilder, astBuilder: IAstBuilder, logger: Logger): Promise<AstDocument> => {
  const apiDoc = await $RefParser.bundle(spec, {
    bundle: {
      generateKey: (value: unknown, file: string, hash: string | null): string | null => {
        const fileName = Path.basename(file);
        const ext = Path.extname(file);

        const path = Path.join(hash ?? '#', '/components/schemas', fileName.slice(0, fileName.length - ext.length));
        return path;
      },
    },
    resolve: {
      file: new FileResolver(logger),
    },
  });

  if (!IsDocument(apiDoc)) {
    throw new Error(`${apiDoc} is not an open api v3 spec`);
  }

  const oasTree = oasBuilder.generateOasTree(apiDoc);

  // move operation declarations to lookups and replace with references
  oasBuilder.makeOperationDeclarationsGlobal(oasTree);

  return astBuilder.makeDocument(oasTree);
};

export async function main(
  oasBuilder: IOpenApiSpecBuilder,
  oasConverter: IOpenApiSpecConverter,
  astBuilder: IAstBuilder,
  logger: Logger
): Promise<void> {
  program.name(pkg.name).description(pkg.description).version(pkg.version);

  /**
   *  TODO parse into
   *   - models
   *   - paths (routes)
   *   - validations
   */

  // take input folder, path template, model template, validation template, template folder, tests
  // --model {name}.models.{ext}
  // if separate path, model, and validation aren't supplied then include them single output

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
    for (const file of globInput) {
      try {
        const ast = await parseSpec(file, oasBuilder, astBuilder, logger);
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

    // const templateFile = await fs.readFile(config.template, 'utf8');
    // const handlebarTemplate = Handlebars.compile(templateFile);

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

export async function _main(
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
    await fs.ensureDir(cliOptions.output);

    const tempExt = (cliOptions.ext as string) ?? 'ts';

    const ext: string = tempExt.startsWith('.') ? tempExt : `.${tempExt}`;
    const debug = cliOptions.debug;
    const path = cliOptions.output;

    // const rootPath = Path.dirname(cliOptions.input);

    // const resolver = new Resolver({
    //   resolvers: {
    //     file: {
    //       resolve: resolveFile,
    //       // resolve: async (ref: URI, ctx: any) => {
    //       //   let path = ref.valueOf();
    //       //   path = Path.isAbsolute(path) ? path : Path.join(rootPath, path);
    //       //   return await fs.readFile(path);
    //       // },
    //     },
    //   },
    // });

    // const fileData = await fs.readFile(cliOptions.input);

    //const apiDoc = await resolver.resolve(fileData, { baseUri: rootPath });

    const apiDoc2 = await $RefParser.bundle(cliOptions.input, {
      bundle: {
        generateKey: (value: unknown, file: string, hash: string | null): string | null => {
          const fileName = Path.basename(file);
          const ext = Path.extname(file);

          const path = Path.join(hash ?? '#', '/components/schemas', fileName.slice(0, fileName.length - ext.length));
          return path;
        },
      },
      resolve: {
        file: new FileResolver(logger),
      },
    });

    //const apiDoc = await OpenAPIParser.bundle(cliOptions.input, { resolve: { file: new FileResolver(logger) } });

    //const { apiDoc, refDocs } = await loadReferences(await loadOAS(cliOptions.input, rootPath), rootPath);

    // const apiDoc1 = await OpenAPIParser.parse(cliOptions.input);
    //const apiDoc = await resolver.resolve(apiDoc1, { baseUri: rootPath + '/models' });

    const apiDoc = apiDoc2;

    //await fs.writeFile(Path.join(path, `${Path.basename(cliOptions.input)}.bundle.json`), JSON.stringify(apiDoc));

    if (!IsDocument(apiDoc)) {
      throw new Error('Not an open api v3 spec, stopping');
    }

    const oasTree = oasBuilder.generateOasTree(apiDoc);

    // move operation declarations to lookups and replace with references
    oasBuilder.makeOperationDeclarationsGlobal(oasTree);

    const astDocument = astBuilder.makeDocument(oasTree);

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
  }
}
