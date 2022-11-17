import { OpenAPIV3 } from 'openapi-types';
import { IsArraySchemaObject, IsReferenceObject } from '../utilities/openapi.utilities';
import { AbstractSyntaxTree } from './ast';
import { AstNode } from './ast.node';
import { AstNodeDeclaration } from './ast.node.declaration';
import { AstNodeTypeReference } from './ast.node.type.reference';
import { AstNodeTypeObject } from './ast.node.type.object';
import { AstNodeType } from './ast.node.type';
import { AstNodeTypePrimative } from './ast.node.type.primative';
import { AstNodeTypeComposite } from './ast.node.type.composite';
import { AstNodeTypeArray } from './ast.node.type.array';
import { AstNodeOperation, AstNodeOperationHttpMethod } from './ast.node.operation';
import { AstNodeLiteral } from './ast.node.literal';
import {
  IsArrayNode,
  IsBodyNode,
  IsCompositeNode,
  IsContentNode,
  IsDeclarationNode,
  IsObjectNode,
  IsOmitNode,
  IsPrimativeNode,
  IsReferenceNode,
  IsRequestNode,
  IsResponseNode,
  IsUnionNode,
} from './ast.utilities';
import { AstNodeTypeResponse } from './ast.node.type.response';
import { AstNodeTypeContent } from './ast.node.type.content';
import { AstNodeTypeRequest } from './ast.node.type.request';
import { AstNodeTypeBody } from './ast.node.type.body';
import { AstNodeTypeUnion } from './ast.node.type.union';
import { AstNodeModifiers } from './ast.node.modifiers';
import { AstNodeTypeOmit } from './ast.node.type.omit';
import { capitalize } from '../utilities/string.utilities';

export function generateAst(document: OpenAPIV3.Document): AbstractSyntaxTree {
  const declarations: AstNodeDeclaration[] = document.components ? generateDeclarations(document.components) : [];
  const operations: AstNodeOperation[] = document.paths ? generateOperations(document.paths, createDeclarationMappings(declarations)) : [];
  const title = document.info.title;
  const description = document.info.description;
  const version = document.info.version;
  const name = title.replace(/-./g, x => x[1].toUpperCase());
  return { declarations, operations, title, description, version, name };
}

function generateDeclarations(components: OpenAPIV3.ComponentsObject): AstNodeDeclaration[] {
  const declarations: AstNodeDeclaration[] = [];
  const modelMappings = new Map<string, AstNodeDeclaration>();

  if (components.schemas) {
    const records = Object.entries(components.schemas);
    for (const record of records) {
      const name = record[0];
      const schema = record[1];
      const refName = `#/components/schemas/${name}`;
      const generatedName = `${name}Model`;

      const nodeType = generateTypeFromSchema(schema);
      const modifiers = nodeType.modifiers;
      nodeType.modifiers = {};
      const declaration = new AstNodeDeclaration(name, generatedName, nodeType, modifiers, refName);
      declarations.push(declaration);
      modelMappings.set(refName, declaration);
    }
  }

  if (components.requestBodies) {
    const records = Object.entries(components.requestBodies);
    for (const record of records) {
      const name = record[0];
      const schema = record[1];
      const refName = `#/components/requestBodies/${name}`;
      const generatedName = `${name}Request`;

      const nodeType = generateRequestBody(schema, modelMappings);
      const modifiers = nodeType.modifiers;
      nodeType.modifiers = {};

      // Requests should remove readonly fields
      // if (IsReferenceNode(nodeType)) {
      //   nodeType = createOmitNode(nodeType, 'readOnly', modelMappings);
      // }

      declarations.push(new AstNodeDeclaration(name, generatedName, nodeType, modifiers, refName));
    }
  }

  if (components.responses) {
    const records = Object.entries(components.responses);
    for (const record of records) {
      const name = record[0];
      const schema = record[1];
      const refName = `#/components/responses/${name}`;
      const generatedName = `${name}Response`;

      const nodeType = generateResponse(schema);
      if (!nodeType) {
        continue;
      }

      // Responses should remove writeonly fields
      // if (IsReferenceNode(nodeType)) {
      //   nodeType = createOmitNode(nodeType, 'writeOnly', modelMappings);
      // }

      const modifiers = nodeType.modifiers;
      nodeType.modifiers = {};
      declarations.push(new AstNodeDeclaration(name, generatedName, nodeType, modifiers, refName));
    }
  }

  if (components.parameters) {
    const records = Object.entries(components.parameters);
    for (const record of records) {
      const name = record[0];
      const schema = record[1];
      const refName = `#/components/parameters/${name}`;
      const generatedName = `${name}Parameter`;

      const { type } = generateParameter(schema);
      const modifiers = type.modifiers;
      type.modifiers = {};
      declarations.push(new AstNodeDeclaration(name, generatedName, type, modifiers, refName));
    }
  }

  return declarations;
}

function generateTypeFromSchema(schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject): AstNodeType {
  if (IsReferenceObject(schema)) {
    return new AstNodeTypeReference(schema.$ref, {});
  }

  const modifiers: AstNodeModifiers = {
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
    maxItems: schema.maxItems,
    minItems: schema.minItems,
    uniqueItems: schema.uniqueItems,
    maxProperties: schema.maxProperties,
    minProperties: schema.minProperties,
    //required: schema.required?.find(x => x === name) !== undefined,
    enum: schema.enum,
    nullable: schema.nullable,
    readOnly: schema.readOnly,
    writeOnly: schema.writeOnly,
    deprecated: schema.deprecated,
  };

  if (IsArraySchemaObject(schema)) {
    const arrayType = generateTypeFromSchema(schema.items);
    return new AstNodeTypeArray(arrayType, modifiers);
  }

  if (schema.allOf) {
    const compositeTypes = schema.allOf.map(x => generateTypeFromSchema(x));
    return createCompositeNode(compositeTypes, modifiers);
  } else if (schema.type === 'object') {
    const fields: AstNodeDeclaration[] = [];

    if (schema.properties) {
      const propEntries = Object.entries(schema.properties);
      for (const propEntry of propEntries) {
        const identifier = propEntry[0];
        const propertyType = generateTypeFromSchema(propEntry[1]);

        const isRequired = schema.required?.find(x => x === identifier) !== undefined;
        if (isRequired) {
          propertyType.modifiers.required = isRequired;
        }

        const modifiers = propertyType.modifiers;
        propertyType.modifiers = {};
        fields.push(new AstNodeDeclaration(identifier, identifier, propertyType, modifiers));
      }
    }

    return new AstNodeTypeObject(fields, modifiers);
  } else if (schema.type === 'boolean' || schema.type === 'integer' || schema.type === 'number' || schema.type === 'string') {
    let schemaType = schema.type;

    if (schema.type === 'integer') {
      schemaType = 'number';
      if (!modifiers.format) {
        modifiers.format = 'int32';
      }
    }

    return new AstNodeTypePrimative(schemaType, modifiers);
  }

  return new AstNodeTypePrimative('void', {});
}

function createCompositeNode(nodes: AstNodeType[], modifiers: AstNodeModifiers): AstNodeTypeComposite {
  const mergeNodes: AstNodeTypeObject[] = [];
  const modelTypes: AstNodeType[] = [];

  for (const node of nodes) {
    if (IsObjectNode(node)) {
      mergeNodes.push(node);
    } else {
      modelTypes.push(node);
    }
  }

  const merged: AstNodeDeclaration[] = [];
  mergeNodes.forEach(x => merged.push(...x.fields));
  if (merged.length > 0) {
    modelTypes.push(new AstNodeTypeObject(merged, {}));
  }

  return new AstNodeTypeComposite(modelTypes, modifiers);
}

function generateOperations(pathObject: OpenAPIV3.PathsObject, modelMappings: Map<string, AstNodeDeclaration>): AstNodeOperation[] {
  const nodeOperations: AstNodeOperation[] = [];
  const paths = Object.entries(pathObject);

  for (const path of paths) {
    const pathPattern = path[0];
    const pathItem = path[1];

    if (pathItem) {
      nodeOperations.push(...generateOperationFromPathItem(pathPattern, pathItem, modelMappings));
    }
  }

  return nodeOperations;
}

function generateOperationFromPathItem(
  pathPattern: string,
  pathItem: OpenAPIV3.PathItemObject,
  modelMappings: Map<string, AstNodeDeclaration>
): AstNodeOperation[] {
  const nodeOperations: AstNodeOperation[] = [];

  let queryNode: AstNodeType | undefined;
  let headerNode: AstNodeType | undefined;
  let pathNode: AstNodeType | undefined;
  let cookieNode: AstNodeType | undefined;
  let referenceNode: AstNodeType | undefined;

  if (pathItem.parameters) {
    for (const param of pathItem.parameters) {
      const { location, type } = generateParameter(param);
      if (location === 'cookie') {
        cookieNode = type;
      } else if (location === 'header') {
        headerNode = type;
      } else if (location === 'path') {
        pathNode = type;
      } else if (location == 'query') {
        queryNode = type;
      } else if (location == 'reference') {
        referenceNode = type;
      } else {
        console.warn('unknown parameter location encountered', param);
      }
    }
  }

  for (const method in OpenAPIV3.HttpMethods) {
    const operationObject = pathItem[method.toLowerCase() as OpenAPIV3.HttpMethods];
    if (!operationObject) {
      continue;
    }

    const title = operationObject.summary ?? pathItem.summary;
    const description = operationObject.description ?? pathItem.description;
    const deprecated = operationObject.deprecated;
    let returns: string[] | undefined;

    const responses = generateResponses(operationObject.responses);

    // pull response returns to populate the operation comments
    if (responses && responses.modifiers.returns) {
      returns = responses.modifiers.returns;
      responses.modifiers.returns = undefined;
    }

    const requestBody = operationObject.requestBody ? generateRequestBody(operationObject.requestBody, modelMappings) : undefined;

    const request = new AstNodeTypeRequest(requestBody, pathNode, cookieNode, headerNode, queryNode, referenceNode, { description, title });

    const nodeOperation = new AstNodeOperation(
      (operationObject.operationId ?? 'OperationId_NOTDEFINED').replace(/-./g, x => x[1].toUpperCase()),
      capitalize(method) as AstNodeOperationHttpMethod,
      pathPattern,
      responses,
      request,
      { title, description, deprecated, returns }
    );
    nodeOperations.push(nodeOperation);
  }

  return nodeOperations;
}

type ParameterLocations = 'query' | 'header' | 'path' | 'cookie' | 'reference' | 'unknown';

function generateParameter(parameter: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject): {
  location: ParameterLocations;
  type: AstNodeType;
} {
  if (IsReferenceObject(parameter)) {
    return { location: 'reference', type: generateTypeFromSchema(parameter) };
  }

  const name = parameter.name;
  const location = parameter.in as ParameterLocations;

  const nodeType = parameter.schema ? generateTypeFromSchema(parameter.schema) : new AstNodeTypePrimative('void', {});
  nodeType.modifiers.required = parameter.required;
  nodeType.modifiers.deprecated = parameter.deprecated;

  const declaration = new AstNodeDeclaration(name, name, nodeType, {});

  return { location, type: new AstNodeTypeObject([declaration], {}) };
}

function generateHeader(header: OpenAPIV3.ReferenceObject | OpenAPIV3.HeaderObject): AstNodeType {
  if (IsReferenceObject(header)) {
    return generateTypeFromSchema(header);
  }

  const nodeType = header.schema ? generateTypeFromSchema(header.schema) : new AstNodeTypePrimative('void', {});
  nodeType.modifiers.required = header.required;
  nodeType.modifiers.deprecated = header.deprecated;

  return nodeType;
}

function generateResponse(response: OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject): AstNodeType | undefined {
  if (IsReferenceObject(response)) {
    return new AstNodeTypeReference(response.$ref, {});
  }

  //const description = response.description;
  const contentNodes: AstNodeTypeContent[] = [];
  const headersNodes: AstNodeType[] = [];

  if (response.content) {
    const contentMediaTypes = Object.keys(response.content);
    for (const mediaType of contentMediaTypes) {
      const schema = response.content[mediaType].schema;
      if (schema) {
        const nodeType = generateTypeFromSchema(schema);
        contentNodes.push(new AstNodeTypeContent(mediaType, nodeType, {}));
      }
    }
  }

  if (response.headers) {
    const responseHeaders = Object.keys(response.headers);
    for (const header of responseHeaders) {
      headersNodes.push(generateHeader(response.headers[header]));
    }
  }

  if (response.links) {
    console.warn('ast generation for response object links is not implemented yet');
  }

  return contentNodes.length === 0 ? undefined : contentNodes.length === 1 ? contentNodes[0] : new AstNodeTypeUnion(contentNodes, {});
}

function generateResponses(responses: OpenAPIV3.ResponsesObject): AstNodeType | undefined {
  const responsesEntities = Object.entries(responses);
  if (responsesEntities.length === 0) {
    return undefined;
  }

  const responseNodes: AstNodeTypeResponse[] = [];
  const returnComments: string[] = [];

  for (const responseEntry of responsesEntities) {
    const code = responseEntry[0];
    const responseObject = responseEntry[1];

    if (IsReferenceObject(responseObject)) {
      responseNodes.push(new AstNodeTypeResponse(code, new AstNodeTypeReference(responseObject.$ref, {}), [], {}));
      continue;
    }

    const description = responseObject.description;
    const contentNodes: AstNodeTypeContent[] = [];
    const headersNodes: AstNodeType[] = [];
    returnComments.push(`${code} - ${description}`);

    if (responseObject.content) {
      const contentMediaTypes = Object.keys(responseObject.content);
      for (const mediaType of contentMediaTypes) {
        const schema = responseObject.content[mediaType].schema;
        if (schema) {
          const nodeType = generateTypeFromSchema(schema);
          contentNodes.push(new AstNodeTypeContent(mediaType, nodeType, {}));
        }
      }
    }

    if (responseObject.headers) {
      const responseHeaders = Object.keys(responseObject.headers);
      for (const header of responseHeaders) {
        headersNodes.push(generateHeader(responseObject.headers[header]));
      }
    }

    if (responseObject.links) {
      console.warn('ast generation for response object links is not implemented yet');
    }

    const content = contentNodes.length === 0 ? undefined : contentNodes.length === 1 ? contentNodes[0] : new AstNodeTypeUnion(contentNodes, {});

    responseNodes.push(new AstNodeTypeResponse(code, content, headersNodes, {}));
  }

  if (responseNodes.length === 1) {
    const response = responseNodes[0];
    response.modifiers.returns = returnComments;
    return response;
  }

  return new AstNodeTypeUnion(responseNodes, { returns: returnComments });
}

function generateRequestBody(
  request: OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject,
  modelMappings: Map<string, AstNodeDeclaration>
): AstNodeType {
  if (IsReferenceObject(request)) {
    if (!request.$ref.startsWith('#/components/requestBodies/')) {
      console.warn(`${generateRequestBody.name}: Need to check for readonly fields and implement omit node`);
    }
    const refNode = generateTypeFromSchema(request);
    return refNode;
  }

  const description = request.description;
  const required = request.required;

  const contentMediaTypes = Object.keys(request.content);
  const contentNodes: AstNodeTypeContent[] = [];
  for (const mediaType of contentMediaTypes) {
    const schema = request.content[mediaType].schema;
    if (schema) {
      const nodeType = createOmitNode(generateTypeFromSchema(schema), 'readOnly', modelMappings);
      contentNodes.push(new AstNodeTypeContent(mediaType, nodeType, {}));
    }
  }

  return new AstNodeTypeBody(contentNodes, { description, required });
}

function createOmitNode(model: AstNodeType, omitType: 'readOnly' | 'writeOnly', modelMappings: Map<string, AstNodeDeclaration>): AstNodeType {
  const omitDeclarations: string[] = [];

  if (IsReferenceNode(model)) {
    const refModel = modelMappings.get(model.identifier.value);
    if (!refModel) {
      console.warn(`${createOmitNode.name}: Unable to find reference ${model.identifier.value}`, model);
    } else {
      omitDeclarations.push(...getOmitDeclarations(refModel, omitType));
    }
  } else {
    omitDeclarations.push(...getOmitDeclarations(model, omitType));
  }

  return omitDeclarations.length > 0 ? new AstNodeTypeOmit(model, omitDeclarations, {}) : model;
}

function getOmitDeclarations(model: AstNodeType, omitType: 'readOnly' | 'writeOnly'): string[] {
  const omitDeclarations: string[] = [];

  if (IsObjectNode(model)) {
    model.fields.forEach(field => {
      if (field.modifiers[omitType] === true) {
        omitDeclarations.push(field.generatedIdentifier.value);
      }
    });
  } else if (IsDeclarationNode(model)) {
    return getOmitDeclarations(model.type, omitType);
  } else if (IsArrayNode(model)) {
    console.warn(`${getOmitDeclarations.name}: need to handle array node`);
  } else if (IsUnionNode(model)) {
    console.warn(`${getOmitDeclarations.name}: need to handle union node`);
  } else if (IsCompositeNode(model)) {
    console.warn(`${getOmitDeclarations.name}: need to handle composite node`);
  } else {
    console.warn(`${getOmitDeclarations.name}: need to handle node`, model);
  }

  return omitDeclarations;
}

export function createDeclarationMappings(declarations: AstNodeDeclaration[]): Map<string, AstNodeDeclaration> {
  const mapping = new Map<string, AstNodeDeclaration>();

  declarations.forEach(x => {
    if (x.referenceName) {
      if (mapping.has(x.referenceName)) {
        console.warn(`Warning multiple declarations with the same name ${x.referenceName} defined! Last definition wins`);
      }
      mapping.set(x.referenceName, x);
    }
  });

  return mapping;
}

export function convertAstToPoco(ast: AbstractSyntaxTree): any {
  return {
    title: ast.title,
    description: ast.description,
    version: ast.version,
    name: ast.name,
    declarations: ast.declarations.map(x => convertNode(x)),
    operations: ast.operations.map(x => convertNode(x)),
  };
}

function convertNode(node: AstNode): any {
  switch (node.kind) {
    case 'declaration':
      return convertDeclaration(node as AstNodeDeclaration);

    case 'literal':
      return convertLiteral(node as AstNodeLiteral);

    case 'operation':
      return convertOperation(node as AstNodeOperation);

    case 'type':
      return convertType(node as AstNodeType);
  }
}

function convertDeclaration(node: AstNodeDeclaration) {
  return {
    kind: node.kind,
    referenceName: node.referenceName,
    identifier: convertNode(node.identifier),
    generatedIdentifier: convertNode(node.generatedIdentifier),
    modifiers: node.modifiers,
    type: convertNode(node.type),
  };
}

function convertLiteral(node: AstNodeLiteral) {
  return {
    kind: node.kind,
    value: node.value,
    modifiers: node.modifiers,
  };
}

function convertOperation(node: AstNodeOperation): any {
  const request = node.request ? convertNode(node.request) : undefined;
  const responses = node.responses ? convertNode(node.responses) : undefined;
  return {
    kind: node.kind,
    httpMethod: node.httpMethod,
    identifier: convertNode(node.identifier),
    path: node.path,
    responses,
    request,
    modifiers: node.modifiers,
  };
}

function convertType(node: AstNodeType) {
  const json = {
    kind: node.kind,
    modifiers: node.modifiers,
  };

  if (IsObjectNode(node)) {
    return { ...json, fields: node.fields.map(x => convertNode(x)) };
  } else if (IsArrayNode(node)) {
    return { ...json, arrayType: convertNode(node.arrayType) };
  } else if (IsCompositeNode(node)) {
    return { ...json, compositeTypes: node.compositeTypes.map(x => convertNode(x)) };
  } else if (IsUnionNode(node)) {
    return { ...json, unionTypes: node.unionTypes.map(x => convertNode(x)) };
  } else if (IsReferenceNode(node)) {
    return { ...json, identifier: convertNode(node.identifier) };
  } else if (IsPrimativeNode(node)) {
    return { ...json, primativeType: node.primativeType };
  } else if (IsResponseNode(node)) {
    return { ...json, statusCode: node.statusCode, content: node.content ? convertNode(node.content) : undefined, headers: node.headers };
  } else if (IsRequestNode(node)) {
    return {
      ...json,
      body: node.body ? convertNode(node.body) : undefined,
      pathParameters: node.pathParameters ? convertNode(node.pathParameters) : undefined,
      cookieParameters: node.cookieParameters ? convertNode(node.cookieParameters) : undefined,
      headerParameters: node.headerParameters ? convertNode(node.headerParameters) : undefined,
      queryParameters: node.queryParameters ? convertNode(node.queryParameters) : undefined,
      refParameters: node.refParameters ? convertNode(node.refParameters) : undefined,
    };
  } else if (IsContentNode(node)) {
    return { ...json, mediaType: node.mediaType, contentType: convertNode(node.contentType) };
  } else if (IsBodyNode(node)) {
    return { ...json, contents: node.contents.map(x => convertNode(x)) };
  } else if (IsOmitNode(node)) {
    return { ...json, originalType: convertNode(node.originalType), omitFields: node.omitFields };
  } else {
    throw Error('Unknown object node in ast', { cause: node });
  }
}
