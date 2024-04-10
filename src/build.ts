import { createHandlebars, referenceRegistrations } from './handlerbars';
import { OpenApiGeneratorConfiguation, OpenApiGeneratorConfiguationGenerate } from './runtime.config';
import Path from 'path';
import fs from 'fs-extra';
import { Logger } from '@flexbase/logger';
import { runPrettier } from './run.prettier';
import * as glob from 'glob';
import { ParsedDocument } from './parser/parsed.document';
import { OpenApiOptimizer } from './optimizer/openapi.optimizer';
import { Organizer } from './parser/organizer';
import { OptimizedDocument } from './optimizer/optimized.document';
import $RefParser from '@stoplight/json-schema-ref-parser';

const registerPartials = (handlebars: typeof Handlebars, templates: string[]) => {
  const globTemplates = glob.sync(templates);
  for (const file of globTemplates) {
    const name = Path.basename(file);
    const ext = Path.extname(name);
    handlebars.registerPartial(name.replace(ext, ''), fs.readFileSync(file, 'utf8'));
  }
};

const substituteParams = (value: string, variables: Map<string, string>): string => {
  const subRegex = /({.*?})/g;
  const matches = value.match(subRegex);

  if (!matches) return value;

  let newValue = value;

  matches.forEach(match => {
    const substitute = variables.get(match);
    if (substitute) {
      newValue = newValue.replaceAll(match, substitute);
    }
  });

  return newValue;
};

const writeFile = async (path: string, title: string, data: unknown, logger: Logger) => {
  const name = Path.join(path, title);
  let json = JSON.stringify(data);
  try {
    json = await runPrettier(json, 'json');
  } catch (e) {
    logger.info(`Prettier error on ${name}`, e);
  }
  await fs.ensureDir(path);
  await fs.writeFile(name, json);
};

const isEmpty = (document: OptimizedDocument): boolean => {
  return (
    document.components.models === undefined &&
    document.components.responses === undefined &&
    document.components.requests === undefined &&
    document.components.pathParameters === undefined &&
    document.components.headerParameters === undefined &&
    document.components.queryParameters === undefined &&
    document.components.cookieParameters === undefined &&
    document.paths.length === 0
  );
};

export const build = async (config: OpenApiGeneratorConfiguation, parsedDocument: ParsedDocument, logger: Logger) => {
  if (config.generate === undefined) {
    logger.info('No generate config settings found');
    return;
  }

  const organizer = new Organizer(logger);

  const compiler = new OpenApiOptimizer(logger);

  const variables = new Map<string, string>();

  const apiName = parsedDocument.title.trim();

  const regex = /([^a-zA-Z0-9])+/g;
  const variableApi = apiName.replace(regex, '-').toLocaleLowerCase();
  variables.set('{api}', variableApi);

  if (config.debug) {
    const debugPath = substituteParams(config.debugPath, variables);
    await writeFile(debugPath, `${parsedDocument.title}.parsed.json`, parsedDocument, logger);
    await writeFile(debugPath, `${parsedDocument.title}.optimized.json`, compiler.optimize(parsedDocument), logger);
  }

  for (const entry of Object.entries(config.generate)) {
    const generateConfig = entry[1];

    const organizeByTags: boolean = generateConfig.tags ?? config.tags;
    const skipEmpty: boolean = generateConfig.skipEmpty ?? config.skipEmpty;

    const documents = organizeByTags ? organizer.organizeByTags(parsedDocument) : [parsedDocument];

    for (const doc of documents) {
      const variableName = doc.title.trim().replace(regex, '-').toLocaleLowerCase();
      variables.set('{name}', variableName);

      const optimizedDoc = compiler.optimize(doc);

      if (skipEmpty && isEmpty(optimizedDoc)) {
        continue;
      }

      if (config.debug) {
        const debugPath = substituteParams(config.debugPath, variables);
        await writeFile(debugPath, `${doc.title}.parsed.json`, doc, logger);
        await writeFile(debugPath, `${doc.title}.optimized.json`, optimizedDoc, logger);
      }

      await generate(config, generateConfig, variables, optimizedDoc, logger);
    }
  }
};

const generate = async (
  config: OpenApiGeneratorConfiguation,
  generateConfig: OpenApiGeneratorConfiguationGenerate,
  variables: Map<string, string>,
  document: OptimizedDocument,
  logger: Logger,
) => {
  const templates: string[] = [...(config.sharedTemplates ?? []), ...(generateConfig.additionalTemplates ?? [])];

  const jsonSchema = await $RefParser.resolve(document);

  const handlebars = createHandlebars(jsonSchema);
  registerPartials(handlebars, templates);

  referenceRegistrations.clear();
  const templateFile = await fs.readFile(generateConfig.template, 'utf8');
  const handlebarTemplate = handlebars.compile(templateFile);
  const fileName = substituteParams(generateConfig.target, variables);
  await render(config, fileName, document, handlebarTemplate, logger);
};

const render = async (
  config: OpenApiGeneratorConfiguation,
  fileName: string,
  document: OptimizedDocument,
  handlebarTemplate: HandlebarsTemplateDelegate<any>,
  logger: Logger,
) => {
  const context = { document };

  const ext = Path.extname(fileName);

  await fs.ensureDir(Path.dirname(fileName));

  try {
    let rendered = handlebarTemplate(context);

    if (config.prettier) {
      try {
        rendered = await runPrettier(rendered, ext === '.ts' ? 'typescript' : 'babel');
      } catch (e) {
        logger.info(`Prettier error on ${fileName}`, e);
      }
    }

    await fs.writeFile(fileName, rendered, 'utf8');
  } catch (e) {
    logger.error(`Error generating ${fileName}`, e);
  }
};
