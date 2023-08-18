import { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { OpenApiParser3 } from './openapi.v3.parser';
import { OpenApiParser3_1 } from './openapi.v3_1.parser';
import { OpenApiCompiler } from './openapi.compiler';

export class AstBuilder {
  isOpenAPIV2(value: OpenAPI.Document): value is OpenAPIV2.Document {
    return 'swagger' in value && value.swagger === '2.0';
  }

  isOpenAPIV3(value: OpenAPI.Document): value is OpenAPIV3.Document {
    return 'openapi' in value && value.openapi !== '3.1.0';
  }

  isOpenAPIV3_1(value: OpenAPI.Document): value is OpenAPIV3_1.Document {
    return 'openapi' in value && value.openapi === '3.1.0';
  }

  parse(document: OpenAPI.Document) {
    if (this.isOpenAPIV2(document)) {
      throw new Error('v2 not supported');
    }

    if (this.isOpenAPIV3(document)) {
      const parser = new OpenApiParser3();
      return parser.parse(document);
    }

    if (this.isOpenAPIV3_1(document)) {
      const parser = new OpenApiParser3_1();
      return parser.parse(document);
    }

    throw new Error('version not supported');
  }

  compile(documentTree: { components: Record<string, unknown>; paths: Record<string, unknown> }) {
    const compiler = new OpenApiCompiler();
    return compiler.compile(documentTree);
  }
}
