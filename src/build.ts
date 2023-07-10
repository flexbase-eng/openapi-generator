import { IAstBuilder } from './ast/ast.builder.interface';
import { AstDocument } from './ast/nodes/ast.document';
import { createHandlebars, referenceRegistrations } from './handlerbars';
import { OpenApiGeneratorConfiguation, OpenApiGeneratorConfiguationGenerate } from './runtime.config';
import Path from 'path';
import fs from 'fs-extra';
import { Logger } from '@flexbase/logger';
import { runPrettier } from './run.prettier';
import * as glob from 'glob';

export const build = async (config: OpenApiGeneratorConfiguation, astDocument: AstDocument, astBuilder: IAstBuilder, logger: Logger) => {
  if (config.generate === undefined) {
    logger.info('No generate config settings found');
    return;
  }

  for (const entry of Object.entries(config.generate)) {
    const generateConfig = entry[1];

    const organizeByTags: boolean = generateConfig.tags ?? config.tags;
    const shouldFlatten: boolean = generateConfig.flatten ?? config.flatten;
    const resolveReferences: boolean = generateConfig.references ?? config.references;
    const skipEmpty: boolean = generateConfig.skipEmpty ?? config.skipEmpty;

    const documents: AstDocument[] = organizeByTags ? astBuilder.organizeByTags(astDocument) : [astDocument];

    const apiName = astDocument.title.trim();

    const variables = new Map<string, string>();

    //const regex = /(\(|\)|_|\.| )+/g;
    const regex = /([^a-zA-Z0-9])+/g;
    const variableApi = apiName.replace(regex, '-').toLocaleLowerCase();
    variables.set('{api}', variableApi);

    for (const doc of documents) {
      if (shouldFlatten) {
        astBuilder.flattenReferences(doc, !resolveReferences);
      }
      astBuilder.removeUnreferencedModels(doc);

      const variableName = doc.title.trim().replace(regex, '-').toLocaleLowerCase();
      variables.set('{name}', variableName);

      if (skipEmpty && astBuilder.isEmpty(doc)) {
        continue;
      }

      await generate(config, generateConfig, variables, doc, logger);
    }
  }
};

const generate = async (
  config: OpenApiGeneratorConfiguation,
  generateConfig: OpenApiGeneratorConfiguationGenerate,
  variables: Map<string, string>,
  astDocument: AstDocument,
  logger: Logger
) => {
  if (config.debug) {
    const variableName = variables.get('{name}');

    await fs.ensureDir(config.debugPath);
    const name = Path.join(config.debugPath, `${variableName}.ast.json`);
    let json = JSON.stringify(astDocument);
    try {
      json = runPrettier(json, 'json');
    } catch (e) {
      logger.info(`Prettier error on ${name}`, e);
    }
    await fs.writeFile(name, json);
  }

  const templates: string[] = [...(config.sharedTemplates ?? []), ...(generateConfig.additionalTemplates ?? [])];

  const handlebars = createHandlebars();
  registerPartials(handlebars, templates);

  referenceRegistrations.clear();
  const templateFile = await fs.readFile(generateConfig.template, 'utf8');
  const handlebarTemplate = handlebars.compile(templateFile);
  const fileName = substituteParams(generateConfig.target, variables);
  await render(config, fileName, astDocument, handlebarTemplate, logger);
};

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

const render = async (
  config: OpenApiGeneratorConfiguation,
  fileName: string,
  astDocument: AstDocument,
  handlebarTemplate: HandlebarsTemplateDelegate<any>,
  logger: Logger
) => {
  const context = { astDocument };

  const ext = Path.extname(fileName);

  await fs.ensureDir(Path.dirname(fileName));

  try {
    let rendered = handlebarTemplate(context);

    if (config.prettier) {
      try {
        rendered = runPrettier(rendered, ext === '.ts' ? 'typescript' : 'babel');
      } catch (e) {
        logger.info(`Prettier error on ${fileName}`, e);
      }
    }

    await fs.writeFile(fileName, rendered, 'utf8');
  } catch (e) {
    logger.error(`Error generating ${fileName}`, e);
  }
};
