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
  SecurityScheme,
  Union,
  ObjectNode,
  Component,
  Components,
  ResponseBody,
  isReference,
  isObjectNode,
  isComposite,
  isRequestBody,
} from './parsed_nodes';
import { Header, NamedHeader } from './parsed_nodes/header';
import { Logger } from '@flexbase/logger';
import { ParsedDocument } from './parsed.document';
import { Tag } from './parsed_nodes/tag';

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
type TagObject = OpenAPIV3.TagObject | OpenAPIV3_1.TagObject;
interface MixedSchemaObject extends OpenAPIV3_1.BaseSchemaObject {
  type?: (OpenAPIV3_1.ArraySchemaObjectType | NonArraySchemaObjectType)[];
  items?: ReferenceObject | SchemaObject;
}
const nonArraySchemaObjectType: string[] = ['string', 'number', 'boolean', 'integer', 'null'];

type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

export abstract class OpenApiParser {
  constructor(private readonly _logger: Logger) {}

  parse(document: Document): ParsedDocument {
    const title = document.info.title;
    const apiName = document.info.title;
    const description = document.info.description;
    const version = document.info.version;
    const tags = document.tags ? document.tags.map(tag => this.parseTag(tag)) : [];

    const components = document.components ? this.parseComponents(document.components) : {};

    const paths = (document.paths ? this.parsePaths(document.paths, components) : []).sort((a, b) => a.name.localeCompare(b.name));

    return { title, apiName, description, version, components, paths, tags };
  }

  protected parseComponents(componentsObject: ComponentsObject): Components {
    const components: Components = {};

    if (componentsObject.schemas) {
      const records = Object.entries(componentsObject.schemas);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const referenceName = `#/components/schemas/${name}`;

        const definition = this.parseSchema(schema);
        components.models ??= [];
        components.models.push({ name, referenceName, definition });
      }
    }

    if (componentsObject.securitySchemes) {
      const records = Object.entries(componentsObject.securitySchemes);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const referenceName = `#/components/securitySchemes/${name}`;

        const definition = this.parseSecurityScheme(schema);
        components.securitySchemes ??= [];
        components.securitySchemes.push({ name, referenceName, definition });
      }
    }

    if (componentsObject.parameters) {
      const records = Object.entries(componentsObject.parameters);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const referenceName = `#/components/parameters/${name}`;

        const definition = this.parseParameter(schema, components);
        components.parameters ??= [];
        components.parameters.push({ name, referenceName, definition });
      }
    }

    if (componentsObject.headers) {
      const records = Object.entries(componentsObject.headers);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const referenceName = `#/components/headers/${name}`;

        const definition = this.parseHeaderObject(schema, components);
        components.headers ??= [];
        components.headers.push({ name, referenceName, definition });
      }
    }

    if (componentsObject.requestBodies) {
      const records = Object.entries(componentsObject.requestBodies);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const referenceName = `#/components/requestBodies/${name}`;

        const definition = this.parseRequestBody(schema, components);
        if (isRequestBody(definition)) {
          definition.name = name;
        }
        components.requests ??= [];
        components.requests.push({ name, referenceName, definition });
      }
    }

    if (componentsObject.responses) {
      const records = Object.entries(componentsObject.responses);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const referenceName = `#/components/responses/${name}`;

        const definition = this.parseResponse(schema, components);
        components.responses ??= [];
        components.responses.push({ name, referenceName, definition });
      }
    }

    if (componentsObject.callbacks) {
      const records = Object.entries(componentsObject.callbacks);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const referenceName = `#/components/callbacks/${name}`;

        const definition = this.parseCallback(schema, name, components);
        components.callbacks ??= [];
        components.callbacks.push({ name, referenceName, definition });
      }
    }

    return components;
  }

  protected parsePaths(paths: PathsObject, components: Components): Path[] {
    const nodes: Path[] = [];
    const records = Object.entries(paths);
    for (const record of records) {
      const name = record[0];
      const schema = record[1];
      const definition = schema ? this.parsePathItemObject(schema, components) : undefined;
      nodes.push({
        type: 'pathItem',
        name,
        definition,
      });
    }
    return nodes;
  }

  private isReferenceObject(test: object): test is ReferenceObject {
    return '$ref' in test;
  }

  private isArraySchemaObject(test: SchemaObject): test is ArraySchemaObject {
    return test.type === 'array'; // && 'items' in test;
  }

  private isNonArraySchemaObject(test: SchemaObject): test is NonArraySchemaObject {
    return !('items' in test);
  }

  private isMixedSchemaObject(test: SchemaObject): test is MixedSchemaObject {
    return Array.isArray(test.type);
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

  private lookupReference<T extends ParsedNode = ParsedNode>(node: Reference, components: Components, type: keyof Components) {
    const found = components[type]?.find(x => x.referenceName === node.reference);
    if (!found) {
      this._logger.warn(`Unable to find ${type}: ${node.reference}`);
      return undefined;
    }
    return found as Component<T>;
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

  private getModifiers(schema: SchemaObject): Modifiers {
    return {
      name: schema.title,
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
      nullable: (schema as any).nullable,
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

    schema.type ??= type ?? 'object';
    const modifiers = this.getModifiers(schema);

    if (this.isArraySchemaObject(schema)) {
      return this.parseArray(schema, modifiers);
    } else if (this.isMixedSchemaObject(schema)) {
      return this.parseMixedSchemaObject(schema, modifiers);
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

  private parseMediaContent(
    mediaContent: { [media: string]: MediaTypeObject } | undefined,
    omitType: 'readOnly' | 'writeOnly',
    components: Components,
  ): MediaContent[] | undefined {
    if (!mediaContent) return undefined;

    const content: MediaContent[] = [];
    const records = Object.entries(mediaContent);
    for (const record of records) {
      const name = record[0];
      const mediaTypeObject = record[1];

      const definition = this.parseMediaTypeObject(mediaTypeObject, omitType, components);
      content.push({
        type: 'mediaContent',
        name,
        definition,
      });
    }

    return content;
  }

  private parseMediaEncoding(encoding: { [media: string]: EncodingObject } | undefined, components: Components): MediaEncoding[] | undefined {
    if (!encoding) return undefined;
    const encodings: MediaEncoding[] = [];

    if (encoding) {
      const records = Object.entries(encoding);
      for (const record of records) {
        const name = record[0];
        const encoding = record[1];

        const nodeType = this.parseEncodingObject(encoding, components);
        encodings.push({
          name,
          ...nodeType,
        });
      }
    }

    return encodings;
  }

  private parseHeaders(headers: { [header: string]: ReferenceObject | HeaderObject } | undefined, components: Components): NamedHeader[] | undefined {
    if (!headers) return undefined;
    const nodes: NamedHeader[] = [];

    const records = Object.entries(headers);
    for (const record of records) {
      const name = record[0];
      const header = record[1];

      const definition = this.parseHeaderObject(header, components);
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

  protected parseRequestBody(schema: ReferenceObject | RequestBodyObject, components: Components, name?: string): RequestBody | Reference {
    if (this.isReferenceObject(schema)) {
      return this.createReference(schema);
    }

    const description = schema.description;
    const required = schema.required;
    const extensions = this.getExtensions(schema);
    const content = this.parseMediaContent(schema.content, 'readOnly', components);

    return {
      type: 'requestBody',
      name,
      description,
      required,
      extensions,
      content,
    };
  }

  private createOmitDefinition(parsedNode: ParsedNode, omitType: 'readOnly' | 'writeOnly', components: Components): ParsedNode | undefined {
    if (isReference(parsedNode)) {
      const found = this.lookupReference(parsedNode, components, 'models');
      if (found) {
        return this.createOmitDefinition(found.definition, omitType, components);
      }
    } else if (isObjectNode(parsedNode)) {
      const properties = parsedNode.properties.filter(x => x.definition[omitType] !== true);
      if (properties.length !== parsedNode.properties.length) {
        return <ObjectNode>{
          ...parsedNode,
          properties,
        };
      }
    } else if (isComposite(parsedNode)) {
      for (let i = 0; i < parsedNode.definitions.length; ++i) {
        const omitDef = this.createOmitDefinition(parsedNode.definitions[i], omitType, components);
        if (omitDef) {
          parsedNode.definitions[i] = omitDef;
        }
      }
    }
  }

  private parseMediaTypeObject(mediaTypeObject: MediaTypeObject, omitType: 'readOnly' | 'writeOnly', components: Components): MediaType {
    const definition = mediaTypeObject.schema ? this.parseSchema(mediaTypeObject.schema) : undefined;
    const encodings = this.parseMediaEncoding(mediaTypeObject.encoding, components);
    let omitDefinition;

    if (definition) {
      if (isReference(definition)) {
        const found = this.lookupReference(definition, components, 'models');
        if (found) {
          omitDefinition = this.createOmitDefinition(found.definition, omitType, components);
        }
      } else {
        omitDefinition = this.createOmitDefinition(definition, omitType, components);
      }
    }

    return {
      type: 'mediaTypeObject',
      definition: omitDefinition ?? definition,
      encodings,
    };
  }

  private parseEncodingObject(encoding: EncodingObject, components: Components): Encoding {
    const contentType = encoding.contentType;
    const style = encoding.style;
    const explode = encoding.explode;
    const allowReserved = encoding.allowReserved;
    const headers = this.parseHeaders(encoding.headers, components);

    return {
      type: 'encoding',
      contentType,
      style,
      explode,
      allowReserved,
      headers,
    };
  }

  protected parseHeaderObject(header: HeaderObject | ReferenceObject, components: Components): Header | Reference {
    if (this.isReferenceObject(header)) {
      return this.createReference(header);
    }

    return {
      type: 'headerObject',
      ...this.parseParameterBaseObject(header, components),
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

  private parseParameterBaseObject(parameterBaseObject: ParameterBaseObject, components: Components) {
    const description = parameterBaseObject.description;
    const required = parameterBaseObject.required;
    const deprecated = parameterBaseObject.deprecated;
    const allowEmptyValue = parameterBaseObject.allowEmptyValue;
    const style = parameterBaseObject.style;
    const explode = parameterBaseObject.explode;
    const allowReserved = parameterBaseObject.allowReserved;

    const definition = parameterBaseObject.schema ? this.parseSchema(parameterBaseObject.schema) : undefined;
    const content = this.parseMediaContent(parameterBaseObject.content, 'readOnly', components);

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

  protected parseResponse(schema: ReferenceObject | ResponseObject, components: Components): ResponseBody | Reference {
    if (this.isReferenceObject(schema)) {
      return this.createReference(schema);
    }

    const description = schema.description;
    const headers = this.parseHeaders(schema.headers, components);
    const content = this.parseMediaContent(schema.content, 'writeOnly', components);
    const links = this.parseLinks(schema.links);

    return {
      type: 'responseObject',
      description,
      headers,
      content,
      links,
    };
  }

  protected parseParameter(schema: ReferenceObject | ParameterObject, components: Components): Parameter | Reference {
    if (this.isReferenceObject(schema)) {
      return this.createReference(schema);
    }

    return {
      type: 'parameter',
      name: schema.name,
      in: schema.in,
      ...this.parseParameterBaseObject(schema, components),
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

  protected parseCallback(schema: PathItemObject, name: string, components: Components): Callback {
    const definition = this.parsePathItemObject(schema, components);

    return { type: 'callback', name, definition };
  }

  protected parsePathItemObject(schema: ReferenceObject | PathItemObject, components: Components): PathItem | Reference {
    if (this.isReferenceObject(schema)) {
      return this.createReference(schema);
    }

    const operations: Operation[] = [];
    //let parameters: (Parameter | Reference)[] | undefined;

    for (const method in OpenAPIV3.HttpMethods) {
      const operationObject = schema[method.toLowerCase() as OpenAPIV3.HttpMethods];
      if (!operationObject) {
        continue;
      }

      const nodeType = this.parseOperationObject(operationObject, method.toLowerCase(), schema.parameters, components);
      operations.push(nodeType);
    }

    // if (schema.parameters) {
    //   parameters = [];
    //   for (const record of schema.parameters) {
    //     const nodeType = this.parseParameter(record, components);
    //     parameters.push(nodeType);
    //   }
    // }

    return {
      type: 'pathItemObject',
      operations,
      //parameters,
    };
  }

  private parseOperationObject(
    schema: OperationObject,
    method: string,
    pathItemParameters: (ReferenceObject | ParameterObject)[] | undefined,
    components: Components,
  ): Operation {
    let parameters;
    let responses;
    let callbacks;

    const tags = schema.tags;
    const description = schema.description;
    const summary = schema.summary;
    const operationId = schema.operationId;
    const deprecated = schema.deprecated;
    const extensions = this.getExtensions(schema);

    if (tags === undefined || tags.length === 0) {
      this._logger.warn(`Operation ${operationId} does not have any tags`);
    }

    const combinedParameters = [...(pathItemParameters ?? []), ...(schema.parameters ?? [])];

    for (const record of combinedParameters) {
      const nodeType = this.parseParameter(record, components);

      parameters ??= [];
      parameters.push(nodeType);
    }

    const requestBody = schema.requestBody ? this.parseRequestBody(schema.requestBody, components, operationId) : undefined;

    if (schema.responses) {
      responses = [];
      const records = Object.entries(schema.responses);
      for (const record of records) {
        const status = record[0];
        const schema = record[1];

        const definition = this.parseResponse(schema, components);
        responses.push({
          type: 'response',
          status,
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

        callbacks.push(this.parseCallback(schema, name, components));
      }
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

  private parseTag(schema: TagObject): Tag {
    return { type: 'tag', name: schema.name, description: schema.description };
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
      ...modifiers,
    };
  }

  private createProperty(name: string, schema: SchemaObject | ReferenceObject, required: boolean): Property {
    const definition = this.parseSchema(schema);
    const description = definition.description;
    definition.description = undefined;

    return {
      name,
      type: 'property',
      definition,
      required,
      description,
    };
  }

  private parseObject(schema: NonArraySchemaObject, modifiers: Modifiers): ObjectNode {
    const properties: Property[] = [];
    if (schema.properties) {
      const propEntries = Object.entries(schema.properties);
      for (const propEntry of propEntries) {
        if (propEntry[0].length === 0) {
          this._logger.warn('property is missing name');
          continue;
        }
        const required = schema.required?.find(x => x === propEntry[0]) !== undefined;
        properties.push(this.createProperty(propEntry[0], propEntry[1], required));
      }
    }

    return { type: 'object', properties, ...modifiers, required: undefined };
  }

  private parseAllOf(schema: WithRequired<NonArraySchemaObject, 'allOf'>, modifiers: Modifiers): Composite {
    const allOf: (ReferenceObject | SchemaObject)[] = schema.allOf;

    const definitions = allOf.map(x => this.parseSchema(x, schema.type));

    return {
      type: 'composite',
      ...modifiers,
      definitions,
    };
  }

  private parseAnyOf(schema: WithRequired<NonArraySchemaObject, 'anyOf'>, modifiers: Modifiers): Union {
    const anyOf: (ReferenceObject | SchemaObject)[] = schema.anyOf;

    const definitions = anyOf.map(x => this.parseSchema(x, schema.type));

    return {
      type: 'union',
      ...modifiers,
      definitions,
    };
  }

  private parseOneOf(schema: WithRequired<NonArraySchemaObject, 'oneOf'>, modifiers: Modifiers): Union {
    const oneOf: (ReferenceObject | SchemaObject)[] = schema.oneOf;

    const definitions = oneOf.map(x => this.parseSchema(x, schema.type));

    return {
      type: 'union',
      ...modifiers,
      definitions,
    };
  }

  private parseNotObject(schema: ReferenceObject | SchemaObject, modifiers: Modifiers): Exclusion {
    return {
      type: 'exclusion',
      ...modifiers,
      definition: this.parseSchema(schema),
    };
  }

  private parseArray(schema: ArraySchemaObject, modifiers: Modifiers): ArrayNode {
    const hasItems = schema.items !== undefined;
    const hasEnum = schema.enum !== undefined;

    return {
      type: 'array',
      ...modifiers,
      enum: undefined,
      definition: hasItems
        ? this.parseSchema(schema.items)
        : hasEnum
          ? { type: 'string', enum: schema.enum }
          : <ObjectNode>{ type: 'object', properties: [] },
    };
  }

  private parseMixedSchemaObject(schema: MixedSchemaObject, modifiers: Modifiers): Union {
    if (!schema.type) {
      this._logger.warn('Mixed schema missing type array');
      return <Union>{
        type: 'error',
      };
    }

    const definitions: ParsedNode[] = schema.type.map(type => {
      if (type === 'object') {
        return this.parseObject({ ...schema, type }, modifiers);
      } else if (type === 'array') {
        return this.parseArray(<ArraySchemaObject>{ ...schema, type }, modifiers);
      } else if (nonArraySchemaObjectType.includes(type)) {
        return this.createLiteral({ ...schema, type }, modifiers);
      } else {
        return { type: 'error' };
      }
    });

    return {
      type: 'union',
      ...modifiers,
      enum: undefined,
      definitions,
    };
  }
}
