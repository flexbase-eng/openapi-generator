import { OpenAPIV3 as OpenAPI } from 'openapi-types';
import { Identifier, ReferenceIdentifier } from './parsed_ast/identifier';
import { Literal, LiteralBoolean, LiteralInteger, LiteralNumber, LiteralObject, LiteralString } from './parsed_ast/literal';
import { ObjectDeclaration } from './parsed_ast/declaration';
import { Statement } from './parsed_ast/statement';
import { Node, NodeModifiers } from './parsed_ast/node';
import { OpenApiParser } from './openapi.parser';
import { Components } from './parsed_ast/components';

export class OpenApiParser3 extends OpenApiParser {
  parse(document: OpenAPI.Document) {
    const components = document.components ? this.parseComponents(document.components) : new Components();

    const paths = document.paths ? this.parsePaths(document.paths) : {};

    return { components, paths };
  }

  parseComponents(components: OpenAPI.ComponentsObject): Components {
    const models: ObjectDeclaration[] = [];
    const requestBodies: ObjectDeclaration[] = [];
    const responses: ObjectDeclaration[] = [];
    const parameters: ObjectDeclaration[] = [];
    const headers: ObjectDeclaration[] = [];
    const securitySchemes: ObjectDeclaration[] = [];
    const callbacks: ObjectDeclaration[] = [];

    const symbols = new Components();

    if (components.schemas) {
      const records = Object.entries(components.schemas);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const refName = `#/components/schemas/${name}`;

        const declaration = this.parseComponentSchema(new ObjectDeclaration(name, 'model'), schema);
        symbols.addExpression(declaration);
      }
    }

    // if (components.requestBodies) {
    //   const records = Object.entries(components.requestBodies);
    //   for (const record of records) {
    //     const name = record[0];
    //     const schema = record[1];
    //     const refName = `#/components/requestBodies/${name}`;

    //     const nodeType = this.parseRequestBody(schema);
    //     requestBodies.push(new Declaration(this.createIdentifier(name), nodeType));
    //   }
    // }

    // if (components.responses) {
    //   const records = Object.entries(components.responses);
    //   for (const record of records) {
    //     const name = record[0];
    //     const schema = record[1];
    //     const refName = `#/components/responses/${name}`;

    //     const nodeType = this.parseResponse(schema);
    //     responses.push(new Declaration(this.createIdentifier(name), nodeType));
    //   }
    // }

    // if (components.parameters) {
    //   const records = Object.entries(components.parameters);
    //   for (const record of records) {
    //     const name = record[0];
    //     const schema = record[1];
    //     const refName = `#/components/parameters/${name}`;

    //     const nodeType = this.parseParameter(schema);
    //     parameters.push(new Declaration(this.createIdentifier(name), nodeType));
    //   }
    // }

    // if (components.headers) {
    //   const records = Object.entries(components.headers);
    //   for (const record of records) {
    //     const name = record[0];
    //     const schema = record[1];
    //     const refName = `#/components/headers/${name}`;

    //     const nodeType = this.parseHeaderObject(schema);
    //     headers.push(new Declaration(this.createIdentifier(name), nodeType));
    //   }
    // }

    // if (components.securitySchemes) {
    //   const records = Object.entries(components.securitySchemes);
    //   for (const record of records) {
    //     const name = record[0];
    //     const schema = record[1];
    //     const refName = `#/components/securitySchemes/${name}`;

    //     const nodeType = this.parseSecurityScheme(schema);
    //     securitySchemes.push(new Declaration(this.createIdentifier(name), nodeType));
    //   }
    // }

    // if (components.callbacks) {
    //   const records = Object.entries(components.callbacks);
    //   for (const record of records) {
    //     const name = record[0];
    //     const schema = record[1];
    //     const refName = `#/components/callbacks/${name}`;

    //     const nodeType = this.parseCallback(schema);
    //     callbacks.push(new Declaration(this.createIdentifier(name), nodeType));
    //   }
    // }

    return symbols;
  }

  parsePaths(paths: OpenAPI.PathsObject) {
    // const nodes = [];
    // const records = Object.entries(paths);
    // for (const record of records) {
    //   const name = record[0];
    //   const schema = record[1];
    //   const nodeType = schema ? this.parsePathItemObject(schema) : undefined;
    //   nodes.push({
    //     identifier: this.createIdentifier(name),
    //     ...nodeType,
    //   });
    // }
    // return nodes;
  }

  // isReferenceObject(test: object): test is OpenAPI.ReferenceObject {
  //   return '$ref' in test;
  // }

  // isArraySchemaObject(test: OpenAPI.SchemaObject): test is OpenAPI.ArraySchemaObject {
  //   return 'items' in test && test.type === 'array';
  // }

  // isNonArraySchemaObject(test: OpenAPI.SchemaObject): test is OpenAPI.NonArraySchemaObject {
  //   return !('items' in test);
  // }

  // private getExtensions(obj: any): Record<string, string> | undefined {
  //   const extensions: Record<string, string> = {};

  //   const keys = Object.keys(obj).filter(key => key.startsWith('x-'));

  //   if (keys.length === 0) {
  //     return undefined;
  //   }

  //   keys.forEach(key => (extensions[key] = obj[key]));

  //   return extensions;
  // }

  // private getSchemaModifiers(schema: OpenAPI.BaseSchemaObject): NodeModifiers {
  //   return {
  //     title: schema.title,
  //     description: schema.description,
  //     format: schema.format,
  //     default: schema.default,
  //     multipleOf: schema.multipleOf,
  //     maximum: schema.maximum,
  //     exclusiveMaximum: schema.exclusiveMaximum,
  //     minimum: schema.minimum,
  //     exclusiveMinimum: schema.exclusiveMinimum,
  //     maxLength: schema.maxLength,
  //     minLength: schema.minLength,
  //     pattern: schema.pattern,
  //     additionalProperties: schema.additionalProperties,
  //     maxItems: schema.maxItems,
  //     minItems: schema.minItems,
  //     uniqueItems: schema.uniqueItems,
  //     maxProperties: schema.maxProperties,
  //     minProperties: schema.minProperties,
  //     //required: schema.required,
  //     enum: schema.enum,
  //     nullable: schema.nullable,
  //     discriminator: schema.discriminator,
  //     readOnly: schema.readOnly,
  //     writeOnly: schema.writeOnly,
  //     deprecated: schema.deprecated,
  //     extensions: this.getExtensions(schema),
  //     example: schema.example,
  //   };
  // }

  // parseSchema(schema: OpenAPI.SchemaObject | OpenAPI.ReferenceObject) {
  //   if (this.isReferenceObject(schema)) {
  //     return this.createReference(schema);
  //   }

  //   const modifiers = this.getSchemaModifiers(schema);

  //   if (this.isArraySchemaObject(schema)) {
  //     return {
  //       node: 'ArrayExpression',
  //       ...modifiers,
  //     };
  //   } else if (this.isNonArraySchemaObject(schema)) {
  //     if (schema.allOf) {
  //       return this.parseComposite(schema.allOf, modifiers);
  //     }

  //     if (schema.anyOf) {
  //       return this.parseUnion(schema.anyOf, modifiers);
  //     }

  //     if (schema.oneOf) {
  //       return this.parseUnion(schema.oneOf, modifiers);
  //     }

  //     if (schema.not) {
  //       return this.parseNotObject(schema.not, modifiers);
  //     }

  //     if (schema.type === 'object') {
  //       return this.parseObject(schema, modifiers);
  //     }

  //     if (schema.type && nonArraySchemaObjectType.includes(schema.type)) {
  //       return this.createLiteral(schema, modifiers);
  //     }
  //   }

  //   return { node: 'void', ...modifiers };
  // }

  // private parseMediaContent(mediaContent?: { [media: string]: OpenAPI.MediaTypeObject }): Statement {
  //   if (!mediaContent) return this.createStatement([], {});

  //   const content = [];
  //   const records = Object.entries(mediaContent);
  //   for (const record of records) {
  //     const name = record[0];
  //     const mediaTypeObject = record[1];

  //     const nodeType = this.parseMediaTypeObject(mediaTypeObject);
  //     content.push({
  //       node: 'MediaExpression',
  //       identifier: this.createIdentifier(name),
  //       type: nodeType,
  //     });
  //   }

  //   return this.createStatement(content, {});
  // }

  // private parseMediaEncoding(encoding?: { [media: string]: OpenAPI.EncodingObject }) {
  //   if (!encoding) return undefined;
  //   const encodings = [];

  //   if (encoding) {
  //     const records = Object.entries(encoding);
  //     for (const record of records) {
  //       const name = record[0];
  //       const encoding = record[1];

  //       const nodeType = this.parseEncodingObject(encoding);
  //       encodings.push({
  //         node: 'EncodingExpression',
  //         identifier: this.createIdentifier(name),
  //         type: nodeType,
  //       });
  //     }
  //   }

  //   return encodings;
  // }

  // private parseHeaders(headers?: { [header: string]: OpenAPI.ReferenceObject | OpenAPI.HeaderObject }) {
  //   if (!headers) return undefined;
  //   const nodes = [];

  //   const records = Object.entries(headers);
  //   for (const record of records) {
  //     const name = record[0];
  //     const header = record[1];

  //     const nodeType = this.parseHeaderObject(header);
  //     nodes.push({
  //       node: 'HeaderExpression',
  //       identifier: this.createIdentifier(name),
  //       type: nodeType,
  //     });
  //   }
  //   return nodes;
  // }

  // private parseLinks(links?: { [link: string]: OpenAPI.ReferenceObject | OpenAPI.LinkObject }) {
  //   if (!links) return undefined;
  //   const nodes = [];

  //   const records = Object.entries(links);
  //   for (const record of records) {
  //     const name = record[0];
  //     const link = record[1];

  //     const nodeType = this.parseLinkObject(link);
  //     nodes.push({
  //       node: 'LinkExpression',
  //       identifier: this.createIdentifier(name),
  //       type: nodeType,
  //     });
  //   }
  //   return nodes;
  // }

  // parseRequestBody(schema: OpenAPI.ReferenceObject | OpenAPI.RequestBodyObject) {
  //   if (this.isReferenceObject(schema)) {
  //     return this.createReference(schema);
  //   }

  //   const description = schema.description;
  //   const required = schema.required;
  //   const extensions = this.getExtensions(schema);
  //   const content = this.parseMediaContent(schema.content);

  //   return this.createStatement([content], { description, extensions });
  // }

  // parseMediaTypeObject(mediaTypeObject: OpenAPI.MediaTypeObject): object {
  //   const type = mediaTypeObject.schema ? this.parseSchema(mediaTypeObject.schema) : undefined;
  //   const encodings = this.parseMediaEncoding(mediaTypeObject.encoding);

  //   return {
  //     node: 'MediaTypeObjectExpression',
  //     type,
  //     encodings,
  //   };
  // }

  // parseEncodingObject(encoding: OpenAPI.EncodingObject): object {
  //   const contentType = encoding.contentType;
  //   const style = encoding.style;
  //   const explode = encoding.explode;
  //   const allowReserved = encoding.allowReserved;
  //   const headers = this.parseHeaders(encoding.headers);

  //   return {
  //     node: 'EncodingObjectExpression',
  //     contentType,
  //     style,
  //     explode,
  //     allowReserved,
  //     headers,
  //   };
  // }

  // parseHeaderObject(header: OpenAPI.HeaderObject | OpenAPI.ReferenceObject) {
  //   if (this.isReferenceObject(header)) {
  //     return this.createReference(header);
  //   }

  //   return {
  //     node: 'HeaderObjectExpression',
  //     ...this.parseParameterBaseObject(header),
  //   };
  // }

  // parseLinkObject(link: OpenAPI.ReferenceObject | OpenAPI.LinkObject) {
  //   if (this.isReferenceObject(link)) {
  //     return this.createReference(link);
  //   }

  //   const server = link.server;
  //   const operationRef = link.operationRef;
  //   const operationId = link.operationId;
  //   const requestBody = link.requestBody;
  //   const description = link.description;
  //   const parameters = link.parameters;

  //   return {
  //     node: 'LinkObjectExpression',
  //     server,
  //     operationRef,
  //     operationId,
  //     requestBody,
  //     description,
  //     parameters,
  //   };
  // }

  // private parseParameterBaseObject(parameterBaseObject: OpenAPI.ParameterBaseObject) {
  //   const description = parameterBaseObject.description;
  //   const required = parameterBaseObject.required;
  //   const deprecated = parameterBaseObject.deprecated;
  //   const allowEmptyValue = parameterBaseObject.allowEmptyValue;
  //   const style = parameterBaseObject.style;
  //   const explode = parameterBaseObject.explode;
  //   const allowReserved = parameterBaseObject.allowReserved;

  //   const nodeType = parameterBaseObject.schema ? this.parseSchema(parameterBaseObject.schema) : undefined;
  //   const content = this.parseMediaContent(parameterBaseObject.content);

  //   return {
  //     description,
  //     required,
  //     deprecated,
  //     allowEmptyValue,
  //     style,
  //     explode,
  //     allowReserved,
  //     nodeType,
  //     content,
  //   };
  // }

  // parseResponse(schema: OpenAPI.ReferenceObject | OpenAPI.ResponseObject) {
  //   if (this.isReferenceObject(schema)) {
  //     return this.createReference(schema);
  //   }

  //   const description = schema.description;
  //   const headers = this.parseHeaders(schema.headers);
  //   const content = this.parseMediaContent(schema.content);
  //   const links = this.parseLinks(schema.links);

  //   return {
  //     node: 'ResponseExpression',
  //     description,
  //     headers,
  //     content,
  //     links,
  //   };
  // }

  // parseParameter(schema: OpenAPI.ReferenceObject | OpenAPI.ParameterObject) {
  //   if (this.isReferenceObject(schema)) {
  //     return this.createReference(schema);
  //   }

  //   return {
  //     name: schema.name,
  //     in: schema.in,
  //     ...this.parseParameterBaseObject(schema),
  //   };
  // }

  // parseSecurityScheme(schema: OpenAPI.ReferenceObject | OpenAPI.SecuritySchemeObject) {
  //   if (this.isReferenceObject(schema)) {
  //     return this.createReference(schema);
  //   }

  //   const node: Record<string, unknown> = {
  //     type: schema.type,
  //     description: schema.description,
  //   };

  //   switch (schema.type) {
  //     case 'http':
  //       node['bearerFormat'] = schema.bearerFormat;
  //       node['scheme'] = schema.scheme;
  //       break;

  //     case 'apiKey':
  //       node['name'] = schema.name;
  //       node['in'] = schema.in;
  //       break;

  //     case 'openIdConnect':
  //       node['openIdConnectUrl'] = schema.openIdConnectUrl;
  //       break;

  //     case 'oauth2':
  //       node['flows'] = schema.flows;
  //       break;
  //   }

  //   return node;
  // }

  // parseCallback(schema: OpenAPI.ReferenceObject | OpenAPI.CallbackObject) {
  //   if (this.isReferenceObject(schema)) {
  //     return this.createReference(schema);
  //   }

  //   const nodes = [];

  //   const records = Object.entries(schema);
  //   for (const record of records) {
  //     const name = record[0];
  //     const schema = record[1];
  //     const refName = `#/components/callbacks/${name}`;

  //     const nodeType = this.parsePathItemObject(schema);
  //     nodes.push({
  //       identifier: this.createIdentifier(name),
  //       refName,
  //       ...nodeType,
  //     });
  //   }

  //   return {
  //     node: 'CallbackExpression',
  //     nodes,
  //   };
  // }

  // parsePathItemObject(schema: OpenAPI.ReferenceObject | OpenAPI.PathItemObject) {
  //   if (this.isReferenceObject(schema)) {
  //     return this.createReference(schema);
  //   }

  //   const operations = [];
  //   let parameters;

  //   for (const method in OpenAPI.HttpMethods) {
  //     const operationObject = schema[method.toLowerCase() as OpenAPI.HttpMethods];
  //     if (!operationObject) {
  //       continue;
  //     }

  //     const nodeType = this.parseOperationObject(operationObject, method.toLowerCase());
  //     operations.push(nodeType);
  //   }

  //   if (schema.parameters) {
  //     parameters = [];
  //     for (const record of schema.parameters) {
  //       const nodeType = this.parseParameter(record);
  //       parameters.push(nodeType);
  //     }
  //   }

  //   return {
  //     operations,
  //     parameters,
  //   };
  // }

  // parseOperationObject(schema: OpenAPI.OperationObject, method: string): object {
  //   let parameters;
  //   let responses;
  //   let callbacks;

  //   const tags = schema.tags;
  //   const description = schema.description;
  //   const summary = schema.summary;
  //   const operationId = schema.operationId;
  //   const deprecated = schema.deprecated;
  //   const extensions = this.getExtensions(schema);

  //   if (schema.parameters) {
  //     parameters = [];
  //     for (const record of schema.parameters) {
  //       if (!schema) {
  //         continue;
  //       }

  //       const nodeType = this.parseParameter(record);
  //       parameters.push(nodeType);
  //     }
  //   }

  //   const requestBody = schema.requestBody ? this.parseRequestBody(schema.requestBody) : undefined;

  //   if (schema.responses) {
  //     responses = [];
  //     const records = Object.entries(schema.responses);
  //     for (const record of records) {
  //       const name = record[0];
  //       const schema = record[1];

  //       const nodeType = this.parseResponse(schema);
  //       responses.push({
  //         status: name,
  //         ...nodeType,
  //       });
  //     }
  //   }

  //   if (schema.callbacks) {
  //     callbacks = [];
  //     const records = Object.entries(schema.callbacks);
  //     for (const record of records) {
  //       const name = record[0];
  //       const schema = record[1];

  //       const nodeType = this.parseCallback(schema);
  //       callbacks.push({
  //         identifier: this.createIdentifier(name),
  //         ...nodeType,
  //       });
  //     }
  //   }

  //   const security = schema.security;

  //   return {
  //     node: 'OperationExpression',
  //     method,
  //     tags,
  //     description,
  //     summary,
  //     operationId,
  //     deprecated,
  //     parameters,
  //     requestBody,
  //     responses,
  //     callbacks,
  //     security,
  //     extensions,
  //   };
  // }

  // createReference(schema: OpenAPI.ReferenceObject) {
  //   return new ReferenceIdentifier(schema.$ref);
  // }

  // createLiteral(schema: OpenAPI.NonArraySchemaObject, modifiers: object): Literal {
  //   switch (schema.type) {
  //     case 'boolean':
  //       return new LiteralBoolean(modifiers);

  //     case 'integer':
  //       return new LiteralInteger(modifiers);

  //     case 'number':
  //       return new LiteralNumber(modifiers);

  //     case 'object':
  //       return new LiteralObject(modifiers);

  //     case 'string':
  //       return new LiteralString(modifiers);

  //     default:
  //       throw new Error(`unknown literal type ${schema.type}`);
  //   }
  // }

  // createIdentifier(name: string): Identifier {
  //   return new Identifier(name);
  // }

  // createProperty(name: string, schema: OpenAPI.SchemaObject | OpenAPI.ReferenceObject, required: boolean): Declaration {
  //   return new Declaration(this.createIdentifier(name), this.parseSchema(schema), required);
  // }

  // parseObject(schema: OpenAPI.NonArraySchemaObject, modifiers: object): Statement {
  //   const properties: Declaration[] = [];
  //   if (schema.properties) {
  //     const propEntries = Object.entries(schema.properties);
  //     for (const propEntry of propEntries) {
  //       const required = schema.required?.find(x => x === propEntry[0]) !== undefined;
  //       properties.push(this.createProperty(propEntry[0], propEntry[1], required));
  //     }
  //   }

  //   return this.createStatement(properties, modifiers);
  // }

  // parseComposite(allOf: (OpenAPI.ReferenceObject | OpenAPI.SchemaObject)[], modifiers: object): Statement {
  //   const types = allOf.map(x => this.parseSchema(x));

  //   return this.createStatement(types, modifiers);
  // }

  // parseUnion(anyOf: (OpenAPI.ReferenceObject | OpenAPI.SchemaObject)[], modifiers: object): Statement {
  //   const types = anyOf.map(x => this.parseSchema(x));

  //   return this.createStatement(types, modifiers);
  // }

  // parseNotObject(not: OpenAPI.ReferenceObject | OpenAPI.SchemaObject, modifiers: object): Statement {
  //   const type = this.parseSchema(not);

  //   return this.createStatement([type], modifiers);
  // }

  // createStatement(statements: Node[], modifiers: NodeModifiers): Statement {
  //   return new Statement(statements, modifiers);
  // }
}
