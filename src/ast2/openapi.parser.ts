import { OpenAPIV3_1, OpenAPIV3 } from 'openapi-types';
import {
  ApiKeySecurityScheme,
  ArrayNode,
  Callback,
  Composite,
  Encoding,
  Exclusion,
  HttpSecurityScheme,
  Link,
  MediaContent,
  MediaEncoding,
  MediaType,
  Modifiers,
  NamedLink,
  OAuth2SecurityScheme,
  OpenIdConnectSecurityScheme,
  Operation,
  Parameter,
  ParsedNode,
  Path,
  PathItem,
  Primative,
  PrimativeTypes,
  Property,
  Reference,
  RequestBody,
  Response,
  SecurityScheme,
  Union,
} from './parsed_nodes';
import { Header, NamedHeader } from './parsed_nodes/header';

type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;
type ReferenceObject = OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject;
type BaseSchemaObject = OpenAPIV3.BaseSchemaObject | OpenAPIV3_1.BaseSchemaObject;
type ArraySchemaObject = OpenAPIV3.ArraySchemaObject | OpenAPIV3_1.ArraySchemaObject;
type NonArraySchemaObject = OpenAPIV3.NonArraySchemaObject | OpenAPIV3_1.NonArraySchemaObject;
type NonArraySchemaObjectType = OpenAPIV3.NonArraySchemaObjectType | OpenAPIV3_1.NonArraySchemaObjectType;
type RequestBodyObject = OpenAPIV3.RequestBodyObject | OpenAPIV3_1.RequestBodyObject;
type MediaTypeObject = OpenAPIV3.MediaTypeObject | OpenAPIV3_1.MediaTypeObject;
type EncodingObject = OpenAPIV3.EncodingObject | OpenAPIV3_1.EncodingObject;
type HeaderObject = OpenAPIV3.HeaderObject | OpenAPIV3_1.HeaderObject;
type LinkObject = OpenAPIV3.LinkObject | OpenAPIV3_1.LinkObject;
type ParameterBaseObject = OpenAPIV3.ParameterBaseObject | OpenAPIV3_1.ParameterBaseObject;
type ResponseObject = OpenAPIV3.ResponseObject | OpenAPIV3_1.ResponseObject;
type ParameterObject = OpenAPIV3.ParameterObject | OpenAPIV3_1.ParameterObject;
type SecuritySchemeObject = OpenAPIV3.SecuritySchemeObject | OpenAPIV3_1.SecuritySchemeObject;
type CallbackObject = OpenAPIV3.CallbackObject | OpenAPIV3_1.CallbackObject;
type PathItemObject = OpenAPIV3.PathItemObject | OpenAPIV3_1.PathItemObject;
type OperationObject = OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject;
type PathsObject = OpenAPIV3.PathsObject | OpenAPIV3_1.PathsObject;

const nonArraySchemaObjectType: string[] = ['string', 'number', 'boolean', 'integer', 'null'];

export abstract class OpenApiParser {
  private isReferenceObject(test: object): test is ReferenceObject {
    return '$ref' in test;
  }

  private isArraySchemaObject(test: SchemaObject): test is ArraySchemaObject {
    return 'items' in test && test.type === 'array';
  }

  private isNonArraySchemaObject(test: SchemaObject): test is NonArraySchemaObject {
    return !('items' in test);
  }

  private getExtensions(obj: any): Record<string, string> | undefined {
    const extensions: Record<string, string> = {};

    const keys = Object.keys(obj).filter(key => key.startsWith('x-'));

    if (keys.length === 0) {
      return undefined;
    }

    keys.forEach(key => (extensions[key] = obj[key]));

    return extensions;
  }

  private getModifiers(schema: any): Modifiers {
    return {
      title: schema.title,
      description: schema.description,
      format: schema.format,
      default: schema.default,
      multipleOf: schema.multipleOf,
      maximum: schema.maximum,
      exclusiveMaximum: schema.exclusiveMaximum,
      minimum: schema.minimum,
      exclusiveMinimum: schema.exclusiveMinimum,
      maxLength: schema.maxLength,
      minLength: schema.minLength,
      pattern: schema.pattern,
      additionalProperties: schema.additionalProperties,
      maxItems: schema.maxItems,
      minItems: schema.minItems,
      uniqueItems: schema.uniqueItems,
      maxProperties: schema.maxProperties,
      minProperties: schema.minProperties,
      required: schema.required,
      enum: schema.enum,
      nullable: schema.nullable,
      discriminator: schema.discriminator,
      readOnly: schema.readOnly,
      writeOnly: schema.writeOnly,
      deprecated: schema.deprecated,
      extensions: this.getExtensions(schema),
      example: schema.example,
    };
  }

  parseSchema(schema: SchemaObject | ReferenceObject): ParsedNode {
    if (this.isReferenceObject(schema)) {
      return this.createReference(schema);
    }

    const modifiers = this.getModifiers(schema);

    if (this.isArraySchemaObject(schema)) {
      return this.createArray(modifiers);
    } else if (this.isNonArraySchemaObject(schema)) {
      if (schema.allOf) {
        return this.parseAllOf(schema.allOf, modifiers);
      }

      if (schema.anyOf) {
        return this.parseAnyOf(schema.anyOf, modifiers);
      }

      if (schema.oneOf) {
        return this.parseAnyOf(schema.oneOf, modifiers);
      }

      if (schema.not) {
        return this.parseNotObject(schema.not, modifiers);
      }

      if (schema.type === 'object') {
        return this.parseObject(schema, modifiers);
      }

      if (schema.type && nonArraySchemaObjectType.includes(schema.type)) {
        return this.createLiteral(schema, modifiers);
      }
    }

    throw new Error(`Unknown schema`);
  }

  parsePaths(paths: PathsObject): Path[] {
    const nodes = [];
    const records = Object.entries(paths);
    for (const record of records) {
      const name = record[0];
      const schema = record[1];
      const definition = schema ? this.parsePathItemObject(schema) : undefined;
      nodes.push({
        name,
        definition,
      });
    }
    return nodes;
  }

  private parseMediaContent(mediaContent?: { [media: string]: MediaTypeObject }): MediaContent[] | undefined {
    if (!mediaContent) return undefined;

    const content: MediaContent[] = [];
    const records = Object.entries(mediaContent);
    for (const record of records) {
      const name = record[0];
      const mediaTypeObject = record[1];

      const definition = this.parseMediaTypeObject(mediaTypeObject);
      content.push({
        name,
        definition,
      });
    }

    return content;
  }

  private parseMediaEncoding(encoding?: { [media: string]: EncodingObject }): MediaEncoding[] | undefined {
    if (!encoding) return undefined;
    const encodings: MediaEncoding[] = [];

    if (encoding) {
      const records = Object.entries(encoding);
      for (const record of records) {
        const name = record[0];
        const encoding = record[1];

        const nodeType = this.parseEncodingObject(encoding);
        encodings.push({
          name,
          ...nodeType,
        });
      }
    }

    return encodings;
  }

  private parseHeaders(headers?: { [header: string]: ReferenceObject | HeaderObject }): NamedHeader[] | undefined {
    if (!headers) return undefined;
    const nodes: NamedHeader[] = [];

    const records = Object.entries(headers);
    for (const record of records) {
      const name = record[0];
      const header = record[1];

      const definition = this.parseHeaderObject(header);
      nodes.push({
        name,
        definition,
      });
    }
    return nodes;
  }

  private parseLinks(links?: { [link: string]: ReferenceObject | LinkObject }): NamedLink[] | undefined {
    if (!links) return undefined;
    const nodes: NamedLink[] = [];

    const records = Object.entries(links);
    for (const record of records) {
      const name = record[0];
      const link = record[1];

      const definition = this.parseLinkObject(link);
      nodes.push({
        name,
        definition,
      });
    }
    return nodes;
  }

  parseRequestBody(schema: ReferenceObject | RequestBodyObject): RequestBody | Reference {
    if (this.isReferenceObject(schema)) {
      return this.createReference(schema);
    }

    const description = schema.description;
    const required = schema.required;
    const extensions = this.getExtensions(schema);
    const content = this.parseMediaContent(schema.content);

    return {
      description,
      required,
      extensions,
      content,
    };
  }

  private parseMediaTypeObject(mediaTypeObject: MediaTypeObject): MediaType {
    const type = mediaTypeObject.schema ? this.parseSchema(mediaTypeObject.schema) : undefined;
    const encodings = this.parseMediaEncoding(mediaTypeObject.encoding);

    return {
      type,
      encodings,
    };
  }

  private parseEncodingObject(encoding: EncodingObject): Encoding {
    const contentType = encoding.contentType;
    const style = encoding.style;
    const explode = encoding.explode;
    const allowReserved = encoding.allowReserved;
    const headers = this.parseHeaders(encoding.headers);

    return {
      contentType,
      style,
      explode,
      allowReserved,
      headers,
    };
  }

  parseHeaderObject(header: HeaderObject | ReferenceObject): Header | Reference {
    if (this.isReferenceObject(header)) {
      return this.createReference(header);
    }

    return {
      ...this.parseParameterBaseObject(header),
    };
  }

  private parseLinkObject(link: ReferenceObject | LinkObject): Link | Reference {
    if (this.isReferenceObject(link)) {
      return this.createReference(link);
    }

    const server = link.server;
    const operationRef = link.operationRef;
    const operationId = link.operationId;
    const requestBody = link.requestBody;
    const description = link.description;
    const parameters = link.parameters;

    return {
      server,
      operationRef,
      operationId,
      requestBody,
      description,
      parameters,
    };
  }

  private parseParameterBaseObject(parameterBaseObject: ParameterBaseObject) {
    const description = parameterBaseObject.description;
    const required = parameterBaseObject.required;
    const deprecated = parameterBaseObject.deprecated;
    const allowEmptyValue = parameterBaseObject.allowEmptyValue;
    const style = parameterBaseObject.style;
    const explode = parameterBaseObject.explode;
    const allowReserved = parameterBaseObject.allowReserved;

    const definition = parameterBaseObject.schema ? this.parseSchema(parameterBaseObject.schema) : undefined;
    const content = this.parseMediaContent(parameterBaseObject.content);

    return {
      description,
      required,
      deprecated,
      allowEmptyValue,
      style,
      explode,
      allowReserved,
      definition,
      content,
    };
  }

  parseResponse(schema: ReferenceObject | ResponseObject): Response | Reference {
    if (this.isReferenceObject(schema)) {
      return this.createReference(schema);
    }

    const description = schema.description;
    const headers = this.parseHeaders(schema.headers);
    const content = this.parseMediaContent(schema.content);
    const links = this.parseLinks(schema.links);

    return {
      description,
      headers,
      content,
      links,
    };
  }

  parseParameter(schema: ReferenceObject | ParameterObject): Parameter | Reference {
    if (this.isReferenceObject(schema)) {
      return this.createReference(schema);
    }

    return {
      name: schema.name,
      in: schema.in,
      ...this.parseParameterBaseObject(schema),
    };
  }

  parseSecurityScheme(schema: ReferenceObject | SecuritySchemeObject): SecurityScheme | Reference {
    if (this.isReferenceObject(schema)) {
      return this.createReference(schema);
    }

    const description = schema.description;

    switch (schema.type) {
      case 'http':
        return <HttpSecurityScheme>{ description, bearerFormat: schema.bearerFormat, scheme: schema.scheme };

      case 'apiKey':
        return <ApiKeySecurityScheme>{ description, name: schema.name, in: schema.in };

      case 'openIdConnect':
        return <OpenIdConnectSecurityScheme>{ description, openIdConnectUrl: schema.openIdConnectUrl };

      case 'oauth2':
        return <OAuth2SecurityScheme>{ description, flows: schema.flows };

      default:
        throw new Error(`Unknown security scheme ${schema}`);
    }
  }

  parseCallback(schema: ReferenceObject | CallbackObject): Callback[] | Reference {
    if (this.isReferenceObject(schema)) {
      return this.createReference(schema);
    }

    const nodes: Callback[] = [];

    const records = Object.entries(schema);
    for (const record of records) {
      const name = record[0];
      const schema = record[1];
      const refName = `#/components/callbacks/${name}`;

      const definition = this.parsePathItemObject(schema);
      nodes.push({
        name,
        definition,
      });
    }

    return nodes;
  }

  parsePathItemObject(schema: ReferenceObject | PathItemObject): PathItem | Reference {
    if (this.isReferenceObject(schema)) {
      return this.createReference(schema);
    }

    const operations: Operation[] = [];
    let parameters: (Parameter | Reference)[] | undefined;

    for (const method in OpenAPIV3.HttpMethods) {
      const operationObject = schema[method.toLowerCase() as OpenAPIV3.HttpMethods];
      if (!operationObject) {
        continue;
      }

      const nodeType = this.parseOperationObject(operationObject, method.toLowerCase());
      operations.push(nodeType);
    }

    if (schema.parameters) {
      parameters = [];
      for (const record of schema.parameters) {
        const nodeType = this.parseParameter(record);
        parameters.push(nodeType);
      }
    }

    return {
      operations,
      parameters,
    };
  }

  private parseOperationObject(schema: OperationObject, method: string): Operation {
    let parameters;
    let responses;
    let callbacks;

    const tags = schema.tags;
    const description = schema.description;
    const summary = schema.summary;
    const operationId = schema.operationId;
    const deprecated = schema.deprecated;
    const extensions = this.getExtensions(schema);

    if (schema.parameters) {
      parameters = [];
      for (const record of schema.parameters) {
        if (!schema) {
          continue;
        }

        const nodeType = this.parseParameter(record);
        parameters.push(nodeType);
      }
    }

    const requestBody = schema.requestBody ? this.parseRequestBody(schema.requestBody) : undefined;

    if (schema.responses) {
      responses = [];
      const records = Object.entries(schema.responses);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];

        const definition = this.parseResponse(schema);
        responses.push({
          status: name,
          definition,
        });
      }
    }

    if (schema.callbacks) {
      callbacks = [];
      const records = Object.entries(schema.callbacks);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];

        const callback = this.parseCallback(schema);
        callbacks.push({
          name,
          callbacks: callback,
        });
      }
    }

    const security = schema.security;

    return {
      method,
      tags,
      description,
      summary,
      operationId,
      deprecated,
      parameters,
      requestBody,
      responses,
      callbacks,
      security,
      extensions,
    };
  }

  private createReference(schema: ReferenceObject): Reference {
    return {
      reference: schema.$ref,
      summary: (schema as Record<string, string>).summary,
      description: (schema as Record<string, string>).description,
    };
  }

  private createLiteral(schema: NonArraySchemaObject, modifiers: Modifiers): Primative {
    return {
      type: schema.type! as PrimativeTypes,
      modifiers,
    };
  }

  private createProperty(name: string, schema: SchemaObject | ReferenceObject, required: boolean): Property {
    return {
      name,
      definition: this.parseSchema(schema),
      required,
    };
  }

  private parseObject(schema: NonArraySchemaObject, modifiers: Modifiers): Object {
    const properties: Property[] = [];
    if (schema.properties) {
      const propEntries = Object.entries(schema.properties);
      for (const propEntry of propEntries) {
        const required = schema.required?.find(x => x === propEntry[0]) !== undefined;
        properties.push(this.createProperty(propEntry[0], propEntry[1], required));
      }
    }

    return { properties, modifiers };
  }

  private parseAllOf(allOf: (ReferenceObject | SchemaObject)[], modifiers: Modifiers): Composite {
    const definitions = allOf.map(x => this.parseSchema(x));

    return {
      modifiers,
      definitions,
    };
  }

  private parseAnyOf(anyOf: (ReferenceObject | SchemaObject)[], modifiers: Modifiers): Union {
    const definitions = anyOf.map(x => this.parseSchema(x));

    return {
      modifiers,
      definitions,
    };
  }

  private parseNotObject(not: ReferenceObject | SchemaObject, modifiers: Modifiers): Exclusion {
    return {
      modifiers,
      definition: this.parseSchema(not),
    };
  }

  private createArray(modifiers: Modifiers): ArrayNode {
    return {
      modifiers,
    };
  }
}
