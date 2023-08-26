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
  ObjectNode,
  Component,
  Components,
} from './parsed_nodes';
import { Header, NamedHeader } from './parsed_nodes/header';
import { Logger } from '@flexbase/logger';
import { CallbackList } from './parsed_nodes/callback';

type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;
type ReferenceObject = OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject;
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
type Document = OpenAPIV3.Document | OpenAPIV3_1.Document;
type ComponentsObject = OpenAPIV3.ComponentsObject | OpenAPIV3_1.ComponentsObject;

const nonArraySchemaObjectType: string[] = ['string', 'number', 'boolean', 'integer', 'null'];

type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

export abstract class OpenApiParser {
  constructor(private readonly _logger: Logger) {}

  parse(document: Document) {
    const components = document.components ? this.parseComponents(document.components) : {};

    const paths = document.paths ? this.parsePaths(document.paths) : {};

    return { components, paths };
  }

  protected parseComponents(components: ComponentsObject): Components {
    const models: Component[] = [];
    const requestBodies: Component[] = [];
    const responses: Component[] = [];
    const parameters: Component[] = [];
    const headers: Component[] = [];
    const securitySchemes: Component[] = [];
    const callbacks: Component[] = [];

    if (components.schemas) {
      const records = Object.entries(components.schemas);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const referenceName = `#/components/schemas/${name}`;

        const definition = this.parseSchema(schema);
        models.push({ name, referenceName, definition });
      }
    }

    if (components.requestBodies) {
      const records = Object.entries(components.requestBodies);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const referenceName = `#/components/requestBodies/${name}`;

        const definition = this.parseRequestBody(schema);
        requestBodies.push({ name, referenceName, definition });
      }
    }

    if (components.responses) {
      const records = Object.entries(components.responses);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const referenceName = `#/components/responses/${name}`;

        const definition = this.parseResponse(schema);
        responses.push({ name, referenceName, definition });
      }
    }

    if (components.parameters) {
      const records = Object.entries(components.parameters);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const referenceName = `#/components/parameters/${name}`;

        const definition = this.parseParameter(schema);
        parameters.push({ name, referenceName, definition });
      }
    }

    if (components.headers) {
      const records = Object.entries(components.headers);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const referenceName = `#/components/headers/${name}`;

        const definition = this.parseHeaderObject(schema);
        headers.push({ name, referenceName, definition });
      }
    }

    if (components.securitySchemes) {
      const records = Object.entries(components.securitySchemes);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const referenceName = `#/components/securitySchemes/${name}`;

        const definition = this.parseSecurityScheme(schema);
        securitySchemes.push({ name, referenceName, definition });
      }
    }

    if (components.callbacks) {
      const records = Object.entries(components.callbacks);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const referenceName = `#/components/callbacks/${name}`;

        const definition = this.parseCallback(schema, name);
        callbacks.push({ name, referenceName, definition });
      }
    }

    return { models, requestBodies, responses, parameters, headers, securitySchemes, callbacks };
  }

  private isReferenceObject(test: object): test is ReferenceObject {
    return '$ref' in test;
  }

  private isArraySchemaObject(test: SchemaObject): test is ArraySchemaObject {
    return 'items' in test && test.type === 'array';
  }

  private isNonArraySchemaObject(test: SchemaObject): test is NonArraySchemaObject {
    return !('items' in test);
  }

  private isAllOf(test: NonArraySchemaObject): test is WithRequired<NonArraySchemaObject, 'allOf'> {
    return test.allOf !== undefined;
  }

  private isAnyOf(test: NonArraySchemaObject): test is WithRequired<NonArraySchemaObject, 'anyOf'> {
    return test.anyOf !== undefined;
  }

  private isOneOf(test: NonArraySchemaObject): test is WithRequired<NonArraySchemaObject, 'oneOf'> {
    return test.oneOf !== undefined;
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

  protected parseSchema(schema: SchemaObject | ReferenceObject, type?: NonArraySchemaObjectType): ParsedNode {
    if (this.isReferenceObject(schema)) {
      return this.createReference(schema);
    }

    schema.type ??= type;
    const modifiers = this.getModifiers(schema);

    if (this.isArraySchemaObject(schema)) {
      return this.createArray(schema, modifiers);
    } else if (this.isNonArraySchemaObject(schema)) {
      if (this.isAllOf(schema)) {
        return this.parseAllOf(schema, modifiers);
      }

      if (this.isAnyOf(schema)) {
        return this.parseAnyOf(schema, modifiers);
      }

      if (this.isOneOf(schema)) {
        return this.parseOneOf(schema, modifiers);
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

    this._logger.error(schema);
    throw new Error(`Unknown schema`);
  }

  protected parsePaths(paths: PathsObject): Path[] {
    const nodes: Path[] = [];
    const records = Object.entries(paths);
    for (const record of records) {
      const name = record[0];
      const schema = record[1];
      const definition = schema ? this.parsePathItemObject(schema) : undefined;
      nodes.push({
        type: 'pathItem',
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
        type: 'mediaContent',
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
        type: 'header',
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
        type: 'link',
        name,
        definition,
      });
    }
    return nodes;
  }

  protected parseRequestBody(schema: ReferenceObject | RequestBodyObject): RequestBody | Reference {
    if (this.isReferenceObject(schema)) {
      return this.createReference(schema);
    }

    const description = schema.description;
    const required = schema.required;
    const extensions = this.getExtensions(schema);
    const content = this.parseMediaContent(schema.content);

    return {
      type: 'requestBody',
      description,
      required,
      extensions,
      content,
    };
  }

  private parseMediaTypeObject(mediaTypeObject: MediaTypeObject): MediaType {
    const definition = mediaTypeObject.schema ? this.parseSchema(mediaTypeObject.schema) : undefined;
    const encodings = this.parseMediaEncoding(mediaTypeObject.encoding);

    return {
      type: 'mediaTypeObject',
      definition,
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
      type: 'encoding',
      contentType,
      style,
      explode,
      allowReserved,
      headers,
    };
  }

  protected parseHeaderObject(header: HeaderObject | ReferenceObject): Header | Reference {
    if (this.isReferenceObject(header)) {
      return this.createReference(header);
    }

    return {
      type: 'headerObject',
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
      type: 'linkObject',
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

  protected parseResponse(schema: ReferenceObject | ResponseObject): Response | Reference {
    if (this.isReferenceObject(schema)) {
      return this.createReference(schema);
    }

    const description = schema.description;
    const headers = this.parseHeaders(schema.headers);
    const content = this.parseMediaContent(schema.content);
    const links = this.parseLinks(schema.links);

    return {
      type: 'response',
      description,
      headers,
      content,
      links,
    };
  }

  protected parseParameter(schema: ReferenceObject | ParameterObject): Parameter | Reference {
    if (this.isReferenceObject(schema)) {
      return this.createReference(schema);
    }

    return {
      type: 'parameter',
      name: schema.name,
      in: schema.in,
      ...this.parseParameterBaseObject(schema),
    };
  }

  protected parseSecurityScheme(schema: ReferenceObject | SecuritySchemeObject): SecurityScheme | Reference {
    if (this.isReferenceObject(schema)) {
      return this.createReference(schema);
    }

    const type = 'securityScheme';
    const description = schema.description;

    switch (schema.type) {
      case 'http':
        return <HttpSecurityScheme>{ type, description, bearerFormat: schema.bearerFormat, scheme: schema.scheme };

      case 'apiKey':
        return <ApiKeySecurityScheme>{ type, description, name: schema.name, in: schema.in };

      case 'openIdConnect':
        return <OpenIdConnectSecurityScheme>{ type, description, openIdConnectUrl: schema.openIdConnectUrl };

      case 'oauth2':
        return <OAuth2SecurityScheme>{ type, description, flows: schema.flows };

      default:
        throw new Error(`Unknown security scheme ${schema}`);
    }
  }

  protected parseCallback(schema: PathItemObject, name: string): Callback {
    const definition = this.parsePathItemObject(schema);

    return { type: 'callback', name, definition };
  }

  protected parseCallbackObject(schema: ReferenceObject | CallbackObject): CallbackList | Reference {
    if (this.isReferenceObject(schema)) {
      return this.createReference(schema);
    }

    const callbacks: Callback[] = [];

    const records = Object.entries(schema);
    for (const record of records) {
      const name = record[0];
      const schema = record[1];
      const refName = `#/components/callbacks/${name}`;

      callbacks.push(this.parseCallback(schema, name));
    }

    return <CallbackList>{ type: 'callbackList', callbacks };
  }

  protected parsePathItemObject(schema: ReferenceObject | PathItemObject): PathItem | Reference {
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
      type: 'pathItemObject',
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
          type: 'responseList',
          status: name,
          definition,
        });
      }
    }

    if (schema.callbacks) {
      const cbs = [];
      const records = Object.entries(schema.callbacks);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];

        cbs.push(this.parseCallback(schema, name));
      }
      callbacks = { type: 'callbackList', callbacks: cbs };
    }

    const security = schema.security;

    return {
      type: 'operation',
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
      type: 'reference',
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
      type: 'property',
      definition: this.parseSchema(schema),
      required,
    };
  }

  private parseObject(schema: NonArraySchemaObject, modifiers: Modifiers): ObjectNode {
    const properties: Property[] = [];
    if (schema.properties) {
      const propEntries = Object.entries(schema.properties);
      for (const propEntry of propEntries) {
        const required = schema.required?.find(x => x === propEntry[0]) !== undefined;
        properties.push(this.createProperty(propEntry[0], propEntry[1], required));
      }
    }

    return { type: 'object', properties, modifiers };
  }

  private parseAllOf(schema: WithRequired<NonArraySchemaObject, 'allOf'>, modifiers: Modifiers): Composite {
    const allOf: (ReferenceObject | SchemaObject)[] = schema.allOf;

    const definitions = allOf.map(x => this.parseSchema(x, schema.type));

    return {
      type: 'composite',
      modifiers,
      definitions,
    };
  }

  private parseAnyOf(schema: WithRequired<NonArraySchemaObject, 'anyOf'>, modifiers: Modifiers): Union {
    const anyOf: (ReferenceObject | SchemaObject)[] = schema.anyOf;

    const definitions = anyOf.map(x => this.parseSchema(x, schema.type));

    return {
      type: 'union',
      modifiers,
      definitions,
    };
  }

  private parseOneOf(schema: WithRequired<NonArraySchemaObject, 'oneOf'>, modifiers: Modifiers): Union {
    const oneOf: (ReferenceObject | SchemaObject)[] = schema.oneOf;

    const definitions = oneOf.map(x => this.parseSchema(x, schema.type));

    return {
      type: 'union',
      modifiers,
      definitions,
    };
  }

  private parseNotObject(schema: ReferenceObject | SchemaObject, modifiers: Modifiers): Exclusion {
    return {
      type: 'exclusion',
      modifiers,
      definition: this.parseSchema(schema),
    };
  }

  private createArray(schema: ArraySchemaObject, modifiers: Modifiers): ArrayNode {
    return {
      type: 'array',
      modifiers,
      definition: this.parseSchema(schema.items),
    };
  }
}
