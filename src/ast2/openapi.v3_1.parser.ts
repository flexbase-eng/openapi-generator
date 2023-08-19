import { OpenAPIV3_1 as OpenAPI, OpenAPIV3 } from 'openapi-types';
import { OpenApiParser } from './openapi.parser';
import { Component, Components, ParsedNode } from './parsed_nodes';

type UnionToIntersection<U> = (U extends never ? never : (arg: U) => never) extends (arg: infer I) => void ? I : never;

type UnionToTuple<T> = UnionToIntersection<T extends never ? never : (t: T) => T> extends (_: never) => infer W
  ? [...UnionToTuple<Exclude<T, W>>, W]
  : [];

const nonArraySchemaObjectTypeArray: UnionToTuple<Exclude<OpenAPI.NonArraySchemaObjectType, 'object'>> = [
  'string',
  'number',
  'boolean',
  'integer',
  'null',
];

const nonArraySchemaObjectType: string[] = nonArraySchemaObjectTypeArray;

export class OpenApiParser3_1 extends OpenApiParser {
  parse(document: OpenAPI.Document) {
    const components = document.components ? this.parseComponents(document.components) : {};

    const paths = document.paths ? this.parsePaths(document.paths) : [];

    return { components, paths };
  }

  parseComponents(components: OpenAPI.ComponentsObject): Components {
    const models: Component[] = [];
    const requestBodies: Component[] = [];
    const responses: Component[] = [];
    const parameters: Component[] = [];
    const headers: Component[] = [];
    const securitySchemes: Component[] = [];
    const callbacks: Component[] = [];
    const pathItems: Component[] = [];

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

        const definition = this.parseCallback(schema);
        callbacks.push({ name, referenceName, definition });
      }
    }

    if (components.pathItems) {
      const records = Object.entries(components.pathItems);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const referenceName = `#/components/pathItems/${name}`;

        const definition = this.parsePathItemObject(schema);
        pathItems.push({ name, referenceName, definition });
      }
    }

    return { models, requestBodies, responses, parameters, headers, securitySchemes, callbacks, pathItems };
  }

  //parsePaths(paths: OpenAPI.PathsObject) {
  //const nodes = [];
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
  //return nodes;
  //}

  // parseSchema(schema: OpenAPI.SchemaObject | OpenAPI.ReferenceObject): Node {
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
  //       return this.parseAllOf(schema.allOf, modifiers);
  //     }

  //     if (schema.anyOf) {
  //       return this.parseAnyOf(schema.anyOf, modifiers);
  //     }

  //     if (schema.oneOf) {
  //       return this.parseAnyOf(schema.oneOf, modifiers);
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

  //   throw new Error(`Unknown schema`);
  // }

  // private parseMediaContent(mediaContent?: { [media: string]: OpenAPI.MediaTypeObject }) {
  //   if (!mediaContent) return undefined;

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

  //   return content;
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

  //   return {
  //     node: 'RequestBodyExpression',
  //     description,
  //     required,
  //     extensions,
  //     content,
  //   };
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

  //   for (const method in OpenAPIV3.HttpMethods) {
  //     const operationObject = schema[method.toLowerCase() as OpenAPIV3.HttpMethods];
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
  //   return {
  //     node: 'ReferenceExpression',
  //     reference: schema.$ref,
  //     summary: schema.summary,
  //     description: schema.description,
  //   };
  // }

  // createLiteral(schema: OpenAPI.NonArraySchemaObject, modifiers: object): Node {
  //   return new Primative(schema.type!, modifiers);
  //   // return {
  //   //   node: 'LiteralExpression',
  //   //   value: schema.type!,
  //   //   ...modifiers,
  //   // };
  // }

  // createIdentifier(name: string): Node {
  //   return new Identifier(name);
  //   // return {
  //   //   node: 'IdentifierExpression',
  //   //   value: name,
  //   // };
  // }

  // createProperty(name: string, schema: OpenAPI.SchemaObject | OpenAPI.ReferenceObject, required: boolean): PropertyExpression {
  //   return new PropertyExpression(new Identifier(name), this.parseSchema(schema), required);
  //   // return {
  //   //   node: 'PropertyExpression',
  //   //   identifier: this.createIdentifier(name),
  //   //   type: this.parseSchema(schema),
  //   //   required,
  //   // };
  // }

  // parseObject(schema: OpenAPI.NonArraySchemaObject, modifiers: object): Node {
  //   const properties: PropertyExpression[] = [];
  //   if (schema.properties) {
  //     const propEntries = Object.entries(schema.properties);
  //     for (const propEntry of propEntries) {
  //       const required = schema.required?.find(x => x === propEntry[0]) !== undefined;
  //       properties.push(this.createProperty(propEntry[0], propEntry[1], required));
  //     }
  //   }

  //   return new NodeList(properties, modifiers);
  // }

  // parseAllOf(allOf: (OpenAPI.ReferenceObject | OpenAPI.SchemaObject)[], modifiers: object): object {
  //   const types = allOf.map(x => this.parseSchema(x));

  //   return {
  //     node: 'CompositeExpression',
  //     ...modifiers,
  //     types,
  //   };
  // }

  // parseAnyOf(anyOf: (OpenAPI.ReferenceObject | OpenAPI.SchemaObject)[], modifiers: object): object {
  //   const types = anyOf.map(x => this.parseSchema(x));

  //   return {
  //     node: 'UnionExpression',
  //     ...modifiers,
  //     types,
  //   };
  // }

  // parseNotObject(not: OpenAPI.ReferenceObject | OpenAPI.SchemaObject, modifiers: object): object {
  //   return {
  //     node: 'NotObjectExpression',
  //     ...modifiers,
  //     type: this.parseSchema(not),
  //   };
  // }
}
