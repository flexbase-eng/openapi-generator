import $RefParser, { FileInfo, ResolverOptions } from '@stoplight/json-schema-ref-parser';
import { IsDocument } from './utilities/openapi.utilities';
import Path from 'path';
import { Logger } from '@flexbase/logger';
import { OpenApiParserFactor } from './parser/openapi.parser.factory';
import { ParsedDocument } from './parser/parsed.document';

export const parseSpec = async (specPath: string, logger: Logger): Promise<ParsedDocument> => {
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

class StoplightResolver implements ResolverOptions {
  order = 0;

  canRead = (file: FileInfo) => {
    return file.url.startsWith('stoplight://');
  };

  read(file: FileInfo) {
    return file.url;
  }
}
