import { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { OpenApiParser3 } from './parsers/openapi.v3.parser.js';
import { OpenApiParser3_1 } from './parsers/openapi.v3_1.parser.js';
import { Logger } from '@flexbase/logger';

export class OpenApiParserFactor {
  private static isOpenAPIV2(value: OpenAPI.Document): value is OpenAPIV2.Document {
    return 'swagger' in value && value.swagger === '2.0';
  }

  private static isOpenAPIV3(value: OpenAPI.Document): value is OpenAPIV3.Document {
    return 'openapi' in value && value.openapi !== '3.1.0';
  }

  private static isOpenAPIV3_1(value: OpenAPI.Document): value is OpenAPIV3_1.Document {
    return 'openapi' in value && value.openapi === '3.1.0';
  }

  static parse(document: OpenAPI.Document, logger: Logger) {
    if (this.isOpenAPIV2(document)) {
      throw new Error('v2 not supported');
    }

    if (this.isOpenAPIV3(document)) {
      const parser = new OpenApiParser3(logger);
      return parser.parse(document);
    }

    if (this.isOpenAPIV3_1(document)) {
      const parser = new OpenApiParser3_1(logger);
      return parser.parse(document);
    }

    throw new Error('version not supported');
  }
}
