import { IAstBuilder } from './ast/ast.builder.interface';
import { AstDocument } from './ast/nodes/ast.document';
import Handlebars, { referenceRegistrations } from './handlerbars';
import { OpenApiGeneratorConfiguation } from './runtime.config';
import Path from 'path';
import fs from 'fs-extra';
import { Logger } from '@flexbase/logger';
import { runPrettier } from './run.prettier';

export const build = async (config: OpenApiGeneratorConfiguation, astDocument: AstDocument, astBuilder: IAstBuilder, logger: Logger) => {
  const documents: AstDocument[] = config.tags ? astBuilder.organizeByTags(astDocument) : [astDocument];

  const apiName = astDocument.title;

  const variables = new Map<string, string>();

  const regex = /(_|\.| )+/g;
  const variableApi = apiName.replace(regex, '-').toLocaleLowerCase();
  variables.set('{api}', variableApi);

  for (const doc of documents) {
    if (config.flatten) {
      astBuilder.flattenReferences(doc, !config.references);
    }
    astBuilder.removeUnreferencedModels(doc);

    const variableName = doc.title.replace(regex, '-').toLocaleLowerCase();
    variables.set('{name}', variableName);

    if (config.debug) {
      const name = Path.join(config.debugPath, `${variableName}.ast.json`);
      let json = JSON.stringify(astDocument);
      try {
        json = runPrettier(json, 'json');
      } catch (e) {
        logger.info(`Prettier error on ${name}`, e);
      }
      await fs.writeFile(name, json);
      console.info(`${apiName}:${variableName} debug output: ${name}`);
    }

    if (config.template && config.target) {
      referenceRegistrations.clear();
      const templateFile = await fs.readFile(config.template, 'utf8');
      const handlebarTemplate = Handlebars.compile(templateFile);
      const fileName = substituteParams(config.target, variables);
      generate(config, fileName, doc, handlebarTemplate, logger);
    }

    // TODO handle additional templates
    if (config.operations) {
      referenceRegistrations.clear();
      const templateFile = await fs.readFile(config.operations.template, 'utf8');
      const handlebarTemplate = Handlebars.compile(templateFile);
      const fileName = substituteParams(config.operations.target, variables);
      generate(config, fileName, doc, handlebarTemplate, logger);
    }

    if (config.models) {
      referenceRegistrations.clear();
      const templateFile = await fs.readFile(config.models.template, 'utf8');
      const handlebarTemplate = Handlebars.compile(templateFile);
      const fileName = substituteParams(config.models.target, variables);
      generate(config, fileName, doc, handlebarTemplate, logger);
    }

    if (config.validations) {
      referenceRegistrations.clear();
      const templateFile = await fs.readFile(config.validations.template, 'utf8');
      const handlebarTemplate = Handlebars.compile(templateFile);
      const fileName = substituteParams(config.validations.target, variables);
      generate(config, fileName, doc, handlebarTemplate, logger);
    }
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

const generate = async (
  config: OpenApiGeneratorConfiguation,
  fileName: string,
  astDocument: AstDocument,
  handlebarTemplate: HandlebarsTemplateDelegate<any>,
  logger: Logger
) => {
  const context = { astDocument };

  let rendered = handlebarTemplate(context);

  const ext = Path.extname(fileName);

  await fs.ensureDir(Path.dirname(fileName));

  if (config.prettier) {
    try {
      rendered = runPrettier(rendered, ext === '.ts' ? 'typescript' : 'babel');
    } catch (e) {
      logger.info(`Prettier error on ${fileName}`, e);
    }
  }

  await fs.writeFile(fileName, rendered, 'utf8');
};
