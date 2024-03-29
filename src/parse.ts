import $RefParser, { FileInfo, ResolverOptions } from '@stoplight/json-schema-ref-parser';
import { IAstBuilder } from './ast/ast.builder.interface';
import { AstDocument } from './ast/nodes/ast.document';
import { IOpenApiSpecBuilder } from './oas-tree/oas.builder.interface';
import { IsDocument } from './utilities/openapi.utilities';
import Path from 'path';
import fs from 'fs-extra';
import { Logger } from '@flexbase/logger';
import { OpenApiGeneratorConfiguation } from './runtime.config';
import { IOpenApiSpecConverter } from './oas-tree/oas.converter.interface';
import { runPrettier } from './run.prettier';
import { OpenApiParserFactor } from './parser/openapi.parser.factory';
import { ParsedDocument } from './parser/parsed.document';

export const parseSpec2 = async (config: OpenApiGeneratorConfiguation, specPath: string, logger: Logger): Promise<ParsedDocument> => {
  const apiDoc = await $RefParser.bundle(specPath, {
    bundle: {
      generateKey: (value: unknown, file: string, hash: string | null): string | null => {
        const fileName = Path.basename(file);
        const ext = Path.extname(file);

        const path = Path.join(hash ?? '#', '/components/schemas', fileName.slice(0, fileName.length - ext.length));
        return path;
      },
    },
    resolve: {
      stoplight: new StoplightResolver(),
    },
  });

  if (!IsDocument(apiDoc)) {
    throw new Error(`${specPath} is not an open api v3 spec`);
  }

  return OpenApiParserFactor.parse(apiDoc, logger);
};

export const parseSpec = async (
  config: OpenApiGeneratorConfiguation,
  specPath: string,
  oasBuilder: IOpenApiSpecBuilder,
  oasConverter: IOpenApiSpecConverter,
  astBuilder: IAstBuilder,
  logger: Logger,
): Promise<AstDocument> => {
  const apiDoc = await $RefParser.bundle(specPath, {
    bundle: {
      generateKey: (value: unknown, file: string, hash: string | null): string | null => {
        const fileName = Path.basename(file);
        const ext = Path.extname(file);

        const path = Path.join(hash ?? '#', '/components/schemas', fileName.slice(0, fileName.length - ext.length));
        return path;
      },
    },
    resolve: {
      stoplight: new StoplightResolver(),
    },
  });

  if (!IsDocument(apiDoc)) {
    throw new Error(`${specPath} is not an open api v3 spec`);
  }

  const oasTree = oasBuilder.generateOasTree(apiDoc);

  // move operation declarations to lookups and replace with references
  oasBuilder.makeOperationDeclarationsGlobal(oasTree);

  if (config.debug) {
    await fs.ensureDir(config.debugPath);
    const name = Path.join(config.debugPath, `${oasTree.title}.oasTree.json`);
    let json = JSON.stringify(oasConverter.convertOasToPoco(oasTree));
    try {
      json = await runPrettier(json, 'json');
    } catch (e) {
      logger.info(`Prettier error on ${name}`, e);
    }
    await fs.writeFile(name, json);
  }

  if (config.debug) {
    await fs.ensureDir(config.debugPath);
    const name = Path.join(config.debugPath, `${oasTree.title}.openapi.json`);
    let json = JSON.stringify(apiDoc);
    try {
      json = await runPrettier(json, 'json');
    } catch (e) {
      logger.info(`Prettier error on ${name}`, e);
    }
    await fs.writeFile(name, json);
  }

  return astBuilder.makeDocument(oasTree);
};

class StoplightResolver implements ResolverOptions {
  order = 0;

  canRead = (file: FileInfo) => {
    return file.url.startsWith('stoplight://');
  };

  read(file: FileInfo) {
    return file.url;
  }
}
