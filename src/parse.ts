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
import { AstBuilder } from './ast2/ast.builder';

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
      file: new FileResolver(logger),
    },
  });

  if (!IsDocument(apiDoc)) {
    throw new Error(`${specPath} is not an open api v3 spec`);
  }

  if (config.debug) {
    const ab = new AstBuilder();
    const output = ab.parse(apiDoc);

    await fs.ensureDir(config.debugPath);
    const name = Path.join(config.debugPath, `ast2.json`);
    let json = JSON.stringify(output);
    try {
      json = await runPrettier(json, 'json');
    } catch (e) {
      logger.info(`Prettier error on ${name}`, e);
    }
    await fs.writeFile(name, json);
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
