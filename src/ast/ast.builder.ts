import { OpenAPIV3 } from 'openapi-types';
import { IsArraySchemaObject, IsReferenceObject } from '../utilities/openapi.utilities';
import { AbstractSyntaxTree } from './ast';
import { AstNode } from './nodes/ast.node';
import { AstNodeDeclaration, ParameterLocations } from './nodes/ast.node.declaration';
import { AstNodeTypeReference } from './nodes/ast.node.type.reference';
import { AstNodeTypeObject } from './nodes/ast.node.type.object';
import { AstNodeType } from './nodes/ast.node.type';
import { AstNodeTypePrimative } from './nodes/ast.node.type.primative';
import { AstNodeTypeComposite } from './nodes/ast.node.type.composite';
import { AstNodeTypeArray } from './nodes/ast.node.type.array';
import { AstNodeOperation, AstNodeOperationHttpMethod } from './nodes/ast.node.operation';
import { AstNodeLiteral } from './nodes/ast.node.literal';
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
} from './ast.node.utilities';
import { AstNodeTypeResponse } from './nodes/ast.node.type.response';
import { AstNodeTypeContent } from './nodes/ast.node.type.content';
import { AstNodeTypeRequest } from './nodes/ast.node.type.request';
import { AstNodeTypeBody } from './nodes/ast.node.type.body';
import { AstNodeTypeUnion } from './nodes/ast.node.type.union';
import { AstNodeModifiers } from './nodes/ast.node.modifiers';
import { AstNodeTypeOmit } from './nodes/ast.node.type.omit';
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

function cleanName(name: string): string {
  return name.replace('.', '_');
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
      const declaration = new AstNodeDeclaration(cleanName(name), cleanName(generatedName), nodeType, modifiers, refName);
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

      declarations.push(new AstNodeDeclaration(cleanName(name), cleanName(generatedName), nodeType, modifiers, refName));
    }
  }

  if (components.responses) {
    const records = Object.entries(components.responses);
    for (const record of records) {
      const name = record[0];
      const schema = record[1];
      const refName = `#/components/responses/${name}`;
      const generatedName = `${name}Response`;

      const nodeType = generateResponse('', schema);
      if (!nodeType) {
        continue;
      }

      const modifiers = nodeType.modifiers;
      nodeType.modifiers = {};
      declarations.push(new AstNodeDeclaration(cleanName(name), cleanName(generatedName), nodeType, modifiers, refName));
    }
  }

  if (components.parameters) {
    const records = Object.entries(components.parameters);
    for (const record of records) {
      const name = record[0];
      const schema = record[1];
      const refName = `#/components/parameters/${name}`;
      const generatedName = `${name}Parameter`;

      const parameterAndLocation = generateParameter(schema);
      if (!parameterAndLocation) {
        continue;
      }

      const type = parameterAndLocation.type;
      const location = parameterAndLocation.location;

      const modifiers = type.modifiers;
      type.modifiers = {};
      declarations.push(new AstNodeDeclaration(cleanName(name), cleanName(generatedName), type, modifiers, refName, location));
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
    extensions: getExtensions(schema),
  };

  if (IsArraySchemaObject(schema)) {
    const arrayType = generateTypeFromSchema(schema.items);
    return new AstNodeTypeArray(arrayType, modifiers);
  }

  if (schema.allOf) {
    const compositeTypes = schema.allOf.map(x => generateTypeFromSchema(x));
    return createCompositeNode(compositeTypes, modifiers);
  } else if (schema.anyOf) {
    const unionTypes = schema.anyOf.map(x => generateTypeFromSchema(x));
    return createUnionNode(unionTypes, modifiers);
  } else if (schema.oneOf) {
    const unionTypes = schema.oneOf.map(x => generateTypeFromSchema(x));
    return createUnionNode(unionTypes, modifiers);
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
  } else if (
    schema.type === 'boolean' ||
    schema.type === 'integer' ||
    schema.type === 'number' ||
    schema.type === 'string' ||
    schema.type == 'null'
  ) {
    return createPrimativeNode(schema.type, modifiers);
  } else if (Array.isArray(schema.type)) {
    const schemaTypeArray: string[] = schema.type;
    const types: AstNodeType[] = [];
    for (const schemaType of schemaTypeArray) {
      types.push(createPrimativeNode(schemaType, {}));
    }

    return createUnionNode(types, modifiers);
  }

  console.warn('Unknown schema type', schema);
  return new AstNodeTypePrimative('void', {});
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

  const { queryNodes, headerNodes, pathNodes, cookieNodes } = generateParameters(pathItem.parameters, modelMappings);

  for (const method in OpenAPIV3.HttpMethods) {
    const operationObject = pathItem[method.toLowerCase() as OpenAPIV3.HttpMethods];
    if (!operationObject) {
      continue;
    }

    const title = operationObject.summary ?? pathItem.summary;
    const description = operationObject.description ?? pathItem.description;
    const deprecated = operationObject.deprecated;
    let returns: string[] | undefined;
    const extensions = getExtensions(operationObject);

    const responses = generateResponses(operationObject.responses);

    // pull response returns to populate the operation comments
    if (responses && responses.modifiers.returns) {
      returns = responses.modifiers.returns;
      responses.modifiers.returns = undefined;
    }

    const parameters = generateParameters(operationObject.parameters, modelMappings);
    parameters.cookieNodes.push(...cookieNodes);
    parameters.headerNodes.push(...headerNodes);
    parameters.pathNodes.push(...pathNodes);
    parameters.queryNodes.push(...queryNodes);

    const cookie = parameters.cookieNodes.length > 0 ? createCompositeNode(parameters.cookieNodes, {}) : undefined;
    const header = parameters.headerNodes.length > 0 ? createCompositeNode(parameters.headerNodes, {}) : undefined;
    const path = parameters.pathNodes.length > 0 ? createCompositeNode(parameters.pathNodes, {}) : undefined;
    const query = parameters.queryNodes.length > 0 ? createCompositeNode(parameters.queryNodes, {}) : undefined;

    const requestBody = operationObject.requestBody ? generateRequestBody(operationObject.requestBody, modelMappings) : undefined;

    const request = new AstNodeTypeRequest(requestBody, path, cookie, header, query, { description, title });

    const nodeOperation = new AstNodeOperation(
      (operationObject.operationId ?? 'OperationId_NOTDEFINED').replace(/-./g, x => x[1].toUpperCase()),
      capitalize(method) as AstNodeOperationHttpMethod,
      pathPattern,
      responses,
      request,
      { title, description, deprecated, returns, extensions }
    );
    nodeOperations.push(nodeOperation);
  }

  return nodeOperations;
}

interface ParameterNodes {
  queryNodes: AstNodeType[];
  headerNodes: AstNodeType[];
  pathNodes: AstNodeType[];
  cookieNodes: AstNodeType[];
}

function generateParameters(
  parameters: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[] | undefined,
  modelMappings: Map<string, AstNodeDeclaration>
): ParameterNodes {
  const queryNodes: AstNodeType[] = [];
  const headerNodes: AstNodeType[] = [];
  const pathNodes: AstNodeType[] = [];
  const cookieNodes: AstNodeType[] = [];

  if (parameters) {
    for (const param of parameters) {
      const parameterAndLocation = generateParameter(param);
      if (!parameterAndLocation) {
        continue;
      }

      const location = parameterAndLocation.location;
      const type = parameterAndLocation.type;

      if (location === 'cookie') {
        cookieNodes.push(type);
      } else if (location === 'header') {
        headerNodes.push(type);
      } else if (location === 'path') {
        pathNodes.push(type);
      } else if (location == 'query') {
        queryNodes.push(type);
      } else if (location == 'reference' && IsReferenceNode(type)) {
        const refNode = modelMappings.get(type.identifier.value);
        if (!refNode) {
          console.warn(`${generateParameters.name}: Unable to find reference ${type.identifier.value}`, type);
        } else if (!refNode.parameterLocation) {
          console.warn(`${generateParameters.name}: Reference missing parameter location ${type.identifier.value}`, type);
        } else {
          const location = refNode.parameterLocation;
          const node = type;
          switch (location) {
            case 'cookie':
              cookieNodes.push(node);
              break;

            case 'header':
              headerNodes.push(node);
              break;

            case 'path':
              pathNodes.push(node);
              break;

            case 'query':
              queryNodes.push(node);
              break;

            default:
              console.warn('unknown parameter location encountered', refNode);
          }
        }
      } else {
        console.warn('unknown parameter location encountered', param);
      }
    }
  }

  return { queryNodes, headerNodes, pathNodes, cookieNodes };
}

interface ParameterLocationAndNode {
  location: ParameterLocations;
  type: AstNodeType;
}

function generateParameter(parameter: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject): ParameterLocationAndNode | undefined {
  if (IsReferenceObject(parameter)) {
    return { location: 'reference', type: generateTypeFromSchema(parameter) };
  }

  const name = parameter.name;
  const location = parameter.in as ParameterLocations;

  if (!name) {
    console.warn(`Missing ${location} parameter name`);
    return undefined;
  }

  const nodeType = parameter.schema ? generateTypeFromSchema(parameter.schema) : new AstNodeTypePrimative('void', {});
  nodeType.modifiers.required = parameter.required;
  nodeType.modifiers.deprecated = parameter.deprecated;

  const required = parameter.required;
  const deprecated = parameter.deprecated;
  const description = parameter.description;

  const declaration = new AstNodeDeclaration(name, name, nodeType, { description, required, deprecated });

  return { location, type: new AstNodeTypeObject([declaration], {}) };
}

function generateHeader(name: string, header: OpenAPIV3.ReferenceObject | OpenAPIV3.HeaderObject): AstNodeType {
  if (IsReferenceObject(header)) {
    return generateTypeFromSchema(header);
  }

  const nodeType = header.schema ? generateTypeFromSchema(header.schema) : new AstNodeTypePrimative('void', {});
  nodeType.modifiers.required = header.required;
  nodeType.modifiers.deprecated = header.deprecated;

  const required = header.required;
  const deprecated = header.deprecated;
  const description = header.description;

  const declaration = new AstNodeDeclaration(name, name, nodeType, { description, required, deprecated });

  return new AstNodeTypeObject([declaration], {});
}

function generateResponse(code: string, response: OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject): AstNodeTypeResponse | undefined {
  if (IsReferenceObject(response)) {
    return new AstNodeTypeResponse(code, new AstNodeTypeReference(response.$ref, {}), undefined, {});
  }

  const description = response.description;
  const contentNodes: AstNodeTypeContent[] = [];

  let headerNode: AstNodeType | undefined;

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
    const headersNodes: AstNodeType[] = [];
    const responseHeaders = Object.keys(response.headers);
    for (const header of responseHeaders) {
      headersNodes.push(generateHeader(header, response.headers[header]));
    }
    headerNode = responseHeaders.length > 0 ? createCompositeNode(headersNodes, {}) : undefined;
  }

  if (response.links) {
    console.warn('ast generation for response object links is not implemented yet');
  }

  const content = contentNodes.length === 0 ? undefined : createUnionNode(contentNodes, { description });

  if (content || headerNode) {
    return new AstNodeTypeResponse(code, content, headerNode, {});
  }

  return undefined;
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

    const responseNode = generateResponse(code, responseObject);

    if (!responseNode) {
      continue;
    }

    returnComments.push(`${code} - ${responseNode.modifiers.description ?? ''}`);

    responseNodes.push(responseNode);
  }

  if (responseNodes.length === 1) {
    const response = responseNodes[0];
    response.modifiers.returns = returnComments;
    return response;
  }

  return createUnionNode(responseNodes, { returns: returnComments });
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

function createPrimativeNode(primativeType: string, modifiers: AstNodeModifiers): AstNodeType {
  if (primativeType === 'integer') {
    primativeType = 'number';
    if (!modifiers.format) {
      modifiers.format = 'int32';
    }
  }

  if (primativeType === 'string' && modifiers.enum) {
    primativeType = modifiers.enum.map(x => `'${x}'`).join(' | ');
  }

  return new AstNodeTypePrimative(primativeType, modifiers);
}

function createCompositeNode(nodes: AstNodeType[], modifiers: AstNodeModifiers): AstNodeType {
  if (nodes.length === 0) {
    throw new Error('Nodes must not be an empty array');
  }

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

  return modelTypes.length > 1 ? new AstNodeTypeComposite(modelTypes, modifiers) : modelTypes[0];
}

function createUnionNode(nodes: AstNodeType[], modifiers: AstNodeModifiers): AstNodeType {
  if (nodes.length === 0) {
    throw new Error('Nodes must not be an empty array');
  }

  return nodes.length === 1 ? nodes[0] : new AstNodeTypeUnion(nodes, modifiers);
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

function getOmitDeclarations(model: AstNode, omitType: 'readOnly' | 'writeOnly'): string[] {
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
    console.error(`${getOmitDeclarations.name}: need to handle array node`);
  } else if (IsUnionNode(model)) {
    console.error(`${getOmitDeclarations.name}: need to handle union node`);
  } else if (IsCompositeNode(model)) {
    console.error(`${getOmitDeclarations.name}: need to handle composite node`);
  } else {
    console.error(`${getOmitDeclarations.name}: need to handle node`, model);
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

function getExtensions(obj: any): Record<string, string> | undefined {
  const extensions: Record<string, string> = {};

  const keys = Object.keys(obj).filter(key => key.startsWith('x-'));

  if (keys.length === 0) {
    return undefined;
  }

  keys.forEach(key => (extensions[key] = obj[key]));

  return extensions;
}

function makeDeclarationGlobal(name: string, node: AstNodeType): { declaration: AstNodeDeclaration; refNode: AstNodeTypeReference } {
  const refName = `#/components/generated/${name}`;
  const modifiers = node.modifiers;
  node.modifiers = {};
  const declaration = new AstNodeDeclaration(name, name, node, modifiers, refName);
  const refNode = new AstNodeTypeReference(refName, {});
  return { declaration, refNode };
}

function makeResponseGlobal(operationId: string, response: AstNodeTypeResponse): AstNodeDeclaration[] {
  const declarations: AstNodeDeclaration[] = [];

  if (response.content && IsContentNode(response.content) && !IsReferenceNode(response.content.contentType)) {
    const { declaration, refNode } = makeDeclarationGlobal(`${operationId}Response`, response.content.contentType);

    declarations.push(declaration);
    response.content.contentType = refNode;
  }

  if (response.headers && !IsReferenceNode(response.headers)) {
    // const updatedHeaders: AstNodeType[] = [];
    // for (const header of response.headers) {
    //   if (IsReferenceNode(header)) {
    //     updatedHeaders.push(header);
    //     continue;
    //   }

    //   const { declaration, refNode } = makeDeclarationGlobal(`${operationId}HeaderResponse`, header);

    //   declarations.push(declaration);
    //   updatedHeaders.push(refNode);
    // }

    const { declaration, refNode } = makeDeclarationGlobal(`${operationId}HeaderResponse`, response.headers);

    declarations.push(declaration);
    response.headers = refNode;
  }

  return declarations;
}

export function makeOperationDeclarationsGlobal(ast: AbstractSyntaxTree): AbstractSyntaxTree {
  for (const operation of ast.operations) {
    const operationId = operation.identifier.value;

    if (operation.responses) {
      const responses = operation.responses;
      if (IsResponseNode(responses)) {
        ast.declarations.push(...makeResponseGlobal(operationId, responses));
      } else if (IsUnionNode(responses)) {
        const { declaration, refNode } = makeDeclarationGlobal(`${operationId}Response`, responses);
        ast.declarations.push(declaration);
        operation.responses = refNode;
      }
    }

    if (!IsRequestNode(operation.request)) {
      continue;
    }

    if (operation.request.pathParameters && !IsReferenceNode(operation.request.pathParameters)) {
      const { declaration, refNode } = makeDeclarationGlobal(`${operationId}PathParameter`, operation.request.pathParameters);

      ast.declarations.push(declaration);
      operation.request.pathParameters = refNode;
    }

    if (operation.request.cookieParameters && !IsReferenceNode(operation.request.cookieParameters)) {
      const { declaration, refNode } = makeDeclarationGlobal(`${operationId}CookieParameter`, operation.request.cookieParameters);

      ast.declarations.push(declaration);
      operation.request.cookieParameters = refNode;
    }

    if (operation.request.headerParameters && !IsReferenceNode(operation.request.headerParameters)) {
      const { declaration, refNode } = makeDeclarationGlobal(`${operationId}HeaderParameter`, operation.request.headerParameters);

      ast.declarations.push(declaration);
      operation.request.headerParameters = refNode;
    }

    if (operation.request.queryParameters && !IsReferenceNode(operation.request.queryParameters)) {
      const { declaration, refNode } = makeDeclarationGlobal(`${operationId}QueryParameter`, operation.request.queryParameters);

      ast.declarations.push(declaration);
      operation.request.queryParameters = refNode;
    }

    if (operation.request.body && !IsReferenceNode(operation.request.body)) {
      const { declaration, refNode } = makeDeclarationGlobal(`${operationId}Body`, operation.request.body);

      ast.declarations.push(declaration);
      operation.request.body = refNode;
    }
  }

  return ast;
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
  if (!node) {
    throw Error();
  }

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
    parameterLocation: node.parameterLocation,
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
    kindType: node.kindType,
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
    return {
      ...json,
      statusCode: node.statusCode,
      content: node.content ? convertNode(node.content) : undefined,
      headers: node.headers ? convertNode(node.headers) : undefined,
    };
  } else if (IsRequestNode(node)) {
    return {
      ...json,
      body: node.body ? convertNode(node.body) : undefined,
      pathParameters: node.pathParameters ? convertNode(node.pathParameters) : undefined,
      cookieParameters: node.cookieParameters ? convertNode(node.cookieParameters) : undefined,
      headerParameters: node.headerParameters ? convertNode(node.headerParameters) : undefined,
      queryParameters: node.queryParameters ? convertNode(node.queryParameters) : undefined,
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

// export function flattenDeclaration(node: AstNodeDeclaration) {
//   const newType = flattenType(node.type);

//   //node.type = newType;

//   return node;
// }

// function flattenType(node: AstNodeType): AstNodeType {}
