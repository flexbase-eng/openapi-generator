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
import {
  IsArrayNode,
  IsCompositeNode,
  IsContentNode,
  IsDeclarationNode,
  IsObjectNode,
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
import { IAbstractSyntaxTreeBuilder, ParameterLocationAndNode, ParameterNodes } from './ast.builder.interface';
import { Logger } from '@flexbase/logger';

function cleanName(name: string): string {
  return name.replace('.', '_');
}

export class AbstractSyntaxTreeBuilder implements IAbstractSyntaxTreeBuilder {
  constructor(private readonly _logger: Logger) {}

  generateAst(document: OpenAPIV3.Document): AbstractSyntaxTree {
    const declarations: AstNodeDeclaration[] = document.components ? this.generateDeclarations(document.components) : [];
    const operations: AstNodeOperation[] = document.paths
      ? this.generateOperations(document.paths, this.createDeclarationMappings(declarations))
      : [];
    const title = document.info.title;
    const description = document.info.description;
    const version = document.info.version;
    const name = title.replace(/-./g, x => x[1].toUpperCase());
    return { declarations, operations, title, description, version, name };
  }

  generateDeclarations(components: OpenAPIV3.ComponentsObject): AstNodeDeclaration[] {
    const declarations: AstNodeDeclaration[] = [];
    const modelMappings = new Map<string, AstNodeDeclaration>();

    if (components.schemas) {
      const records = Object.entries(components.schemas);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const refName = `#/components/schemas/${name}`;
        const generatedName = `${name}Model`;

        const nodeType = this.generateTypeFromSchema(schema);
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

        const nodeType = this.generateRequestBody(schema, modelMappings);
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

        const nodeType = this.generateResponse('', schema);
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

        const parameterAndLocation = this.generateParameter(schema);
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

  generateTypeFromSchema(schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject): AstNodeType {
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
      extensions: this.getExtensions(schema),
    };

    if (IsArraySchemaObject(schema)) {
      const arrayType = this.generateTypeFromSchema(schema.items);
      return new AstNodeTypeArray(arrayType, modifiers);
    }

    if (schema.allOf) {
      const compositeTypes = schema.allOf.map(x => this.generateTypeFromSchema(x));
      return this.createCompositeNode(compositeTypes, modifiers);
    } else if (schema.anyOf) {
      const unionTypes = schema.anyOf.map(x => this.generateTypeFromSchema(x));
      return this.createUnionNode(unionTypes, modifiers);
    } else if (schema.oneOf) {
      const unionTypes = schema.oneOf.map(x => this.generateTypeFromSchema(x));
      return this.createUnionNode(unionTypes, modifiers);
    } else if (schema.type === 'object') {
      const fields: AstNodeDeclaration[] = [];

      if (schema.properties) {
        const propEntries = Object.entries(schema.properties);
        for (const propEntry of propEntries) {
          const identifier = propEntry[0];
          const propertyType = this.generateTypeFromSchema(propEntry[1]);

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
      return this.createPrimativeNode(schema.type, modifiers);
    } else if (Array.isArray(schema.type)) {
      const schemaTypeArray: string[] = schema.type;
      const types: AstNodeType[] = [];
      for (const schemaType of schemaTypeArray) {
        types.push(this.createPrimativeNode(schemaType, {}));
      }

      return this.createUnionNode(types, modifiers);
    }

    this._logger.warn('Unknown schema type', schema);
    return new AstNodeTypePrimative('void', {});
  }

  generateOperations(pathObject: OpenAPIV3.PathsObject, modelMappings: Map<string, AstNodeDeclaration>): AstNodeOperation[] {
    const nodeOperations: AstNodeOperation[] = [];
    const paths = Object.entries(pathObject);

    for (const path of paths) {
      const pathPattern = path[0];
      const pathItem = path[1];

      if (pathItem) {
        nodeOperations.push(...this.generateOperationFromPathItem(pathPattern, pathItem, modelMappings));
      }
    }

    return nodeOperations;
  }

  generateOperationFromPathItem(
    pathPattern: string,
    pathItem: OpenAPIV3.PathItemObject,
    modelMappings: Map<string, AstNodeDeclaration>
  ): AstNodeOperation[] {
    const nodeOperations: AstNodeOperation[] = [];

    const { queryNodes, headerNodes, pathNodes, cookieNodes } = this.generateParameters(pathItem.parameters, modelMappings);

    for (const method in OpenAPIV3.HttpMethods) {
      const operationObject = pathItem[method.toLowerCase() as OpenAPIV3.HttpMethods];
      if (!operationObject) {
        continue;
      }

      const title = operationObject.summary ?? pathItem.summary;
      const description = operationObject.description ?? pathItem.description;
      const deprecated = operationObject.deprecated;
      let returns: string[] | undefined;
      const extensions = this.getExtensions(operationObject);

      const responses = this.generateResponses(operationObject.responses);

      // pull response returns to populate the operation comments
      if (responses && responses.modifiers.returns) {
        returns = responses.modifiers.returns;
        responses.modifiers.returns = undefined;
      }

      const parameters = this.generateParameters(operationObject.parameters, modelMappings);
      parameters.cookieNodes.push(...cookieNodes);
      parameters.headerNodes.push(...headerNodes);
      parameters.pathNodes.push(...pathNodes);
      parameters.queryNodes.push(...queryNodes);

      const cookie = parameters.cookieNodes.length > 0 ? this.createCompositeNode(parameters.cookieNodes, {}) : undefined;
      const header = parameters.headerNodes.length > 0 ? this.createCompositeNode(parameters.headerNodes, {}) : undefined;
      const path = parameters.pathNodes.length > 0 ? this.createCompositeNode(parameters.pathNodes, {}) : undefined;
      const query = parameters.queryNodes.length > 0 ? this.createCompositeNode(parameters.queryNodes, {}) : undefined;

      const requestBody = operationObject.requestBody ? this.generateRequestBody(operationObject.requestBody, modelMappings) : undefined;

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

  generateParameters(
    parameters: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[] | undefined,
    modelMappings: Map<string, AstNodeDeclaration>
  ): ParameterNodes {
    const queryNodes: AstNodeType[] = [];
    const headerNodes: AstNodeType[] = [];
    const pathNodes: AstNodeType[] = [];
    const cookieNodes: AstNodeType[] = [];

    if (parameters) {
      for (const param of parameters) {
        const parameterAndLocation = this.generateParameter(param);
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
            this._logger.warn(`${this.generateParameters.name}: Unable to find reference ${type.identifier.value}`, type);
          } else if (!refNode.parameterLocation) {
            this._logger.warn(`${this.generateParameters.name}: Reference missing parameter location ${type.identifier.value}`, type);
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
                this._logger.warn('unknown parameter location encountered', refNode);
            }
          }
        } else {
          this._logger.warn('unknown parameter location encountered', param);
        }
      }
    }

    return { queryNodes, headerNodes, pathNodes, cookieNodes };
  }

  generateParameter(parameter: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject): ParameterLocationAndNode | undefined {
    if (IsReferenceObject(parameter)) {
      return { location: 'reference', type: this.generateTypeFromSchema(parameter) };
    }

    const name = parameter.name;
    const location = parameter.in as ParameterLocations;

    if (!name) {
      this._logger.warn(`Missing ${location} parameter name`);
      return undefined;
    }

    const nodeType = parameter.schema ? this.generateTypeFromSchema(parameter.schema) : new AstNodeTypePrimative('void', {});
    nodeType.modifiers.required = parameter.required;
    nodeType.modifiers.deprecated = parameter.deprecated;

    const required = parameter.required;
    const deprecated = parameter.deprecated;
    const description = parameter.description;

    const declaration = new AstNodeDeclaration(name, name, nodeType, { description, required, deprecated });

    return { location, type: new AstNodeTypeObject([declaration], {}) };
  }

  generateHeader(name: string, header: OpenAPIV3.ReferenceObject | OpenAPIV3.HeaderObject): AstNodeType {
    if (IsReferenceObject(header)) {
      return this.generateTypeFromSchema(header);
    }

    const nodeType = header.schema ? this.generateTypeFromSchema(header.schema) : new AstNodeTypePrimative('void', {});
    nodeType.modifiers.required = header.required;
    nodeType.modifiers.deprecated = header.deprecated;

    const required = header.required;
    const deprecated = header.deprecated;
    const description = header.description;

    const declaration = new AstNodeDeclaration(name, name, nodeType, { description, required, deprecated });

    return new AstNodeTypeObject([declaration], {});
  }

  generateResponse(code: string, response: OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject): AstNodeTypeResponse | undefined {
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
          const nodeType = this.generateTypeFromSchema(schema);
          contentNodes.push(new AstNodeTypeContent(mediaType, nodeType, {}));
        }
      }
    }

    if (response.headers) {
      const headersNodes: AstNodeType[] = [];
      const responseHeaders = Object.keys(response.headers);
      for (const header of responseHeaders) {
        headersNodes.push(this.generateHeader(header, response.headers[header]));
      }
      headerNode = responseHeaders.length > 0 ? this.createCompositeNode(headersNodes, {}) : undefined;
    }

    if (response.links) {
      this._logger.warn('ast generation for response object links is not implemented yet');
    }

    const content = contentNodes.length === 0 ? undefined : this.createUnionNode(contentNodes, { description });

    if (content || headerNode) {
      return new AstNodeTypeResponse(code, content, headerNode, {});
    }

    return undefined;
  }

  generateResponses(responses: OpenAPIV3.ResponsesObject): AstNodeType | undefined {
    const responsesEntities = Object.entries(responses);
    if (responsesEntities.length === 0) {
      return undefined;
    }

    const responseNodes: AstNodeTypeResponse[] = [];
    const returnComments: string[] = [];

    for (const responseEntry of responsesEntities) {
      const code = responseEntry[0];
      const responseObject = responseEntry[1];

      const responseNode = this.generateResponse(code, responseObject);

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

    return this.createUnionNode(responseNodes, { returns: returnComments });
  }

  generateRequestBody(request: OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject, modelMappings: Map<string, AstNodeDeclaration>): AstNodeType {
    if (IsReferenceObject(request)) {
      if (!request.$ref.startsWith('#/components/requestBodies/')) {
        this._logger.warn(`${this.generateRequestBody.name}: Need to check for readonly fields and implement omit node`);
      }
      const refNode = this.generateTypeFromSchema(request);
      return refNode;
    }

    const description = request.description;
    const required = request.required;

    const contentMediaTypes = Object.keys(request.content);
    const contentNodes: AstNodeTypeContent[] = [];
    for (const mediaType of contentMediaTypes) {
      const schema = request.content[mediaType].schema;
      if (schema) {
        const nodeType = this.createOmitNode(this.generateTypeFromSchema(schema), 'readOnly', modelMappings);
        contentNodes.push(new AstNodeTypeContent(mediaType, nodeType, {}));
      }
    }

    return new AstNodeTypeBody(contentNodes, { description, required });
  }

  createPrimativeNode(primativeType: string, modifiers: AstNodeModifiers): AstNodeType {
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

  createCompositeNode(nodes: AstNodeType[], modifiers: AstNodeModifiers): AstNodeType {
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

  createUnionNode(nodes: AstNodeType[], modifiers: AstNodeModifiers): AstNodeType {
    if (nodes.length === 0) {
      throw new Error('Nodes must not be an empty array');
    }

    return nodes.length === 1 ? nodes[0] : new AstNodeTypeUnion(nodes, modifiers);
  }

  createOmitNode(model: AstNodeType, omitType: 'readOnly' | 'writeOnly', modelMappings: Map<string, AstNodeDeclaration>): AstNodeType {
    const omitDeclarations: string[] = [];

    if (IsReferenceNode(model)) {
      const refModel = modelMappings.get(model.identifier.value);
      if (!refModel) {
        this._logger.warn(`${this.createOmitNode.name}: Unable to find reference ${model.identifier.value}`, model);
      } else {
        omitDeclarations.push(...this.getOmitDeclarations(refModel, omitType));
      }
    } else {
      omitDeclarations.push(...this.getOmitDeclarations(model, omitType));
    }

    return omitDeclarations.length > 0 ? new AstNodeTypeOmit(model, omitDeclarations, {}) : model;
  }

  getOmitDeclarations(model: AstNode, omitType: 'readOnly' | 'writeOnly'): string[] {
    const omitDeclarations: string[] = [];

    if (IsObjectNode(model)) {
      model.fields.forEach(field => {
        if (field.modifiers[omitType] === true) {
          omitDeclarations.push(field.generatedIdentifier.value);
        }
      });
    } else if (IsDeclarationNode(model)) {
      return this.getOmitDeclarations(model.type, omitType);
    } else if (IsArrayNode(model)) {
      this._logger.error(`${this.getOmitDeclarations.name}: need to handle array node`);
    } else if (IsUnionNode(model)) {
      this._logger.error(`${this.getOmitDeclarations.name}: need to handle union node`);
    } else if (IsCompositeNode(model)) {
      this._logger.error(`${this.getOmitDeclarations.name}: need to handle composite node`);
    } else {
      this._logger.error(`${this.getOmitDeclarations.name}: need to handle node`, model);
    }

    return omitDeclarations;
  }

  createDeclarationMappings(declarations: AstNodeDeclaration[]): Map<string, AstNodeDeclaration> {
    const mapping = new Map<string, AstNodeDeclaration>();

    declarations.forEach(x => {
      if (x.referenceName) {
        if (mapping.has(x.referenceName)) {
          this._logger.warn(`Warning multiple declarations with the same name ${x.referenceName} defined! Last definition wins`);
        }
        mapping.set(x.referenceName, x);
      }
    });

    return mapping;
  }

  getExtensions(obj: any): Record<string, string> | undefined {
    const extensions: Record<string, string> = {};

    const keys = Object.keys(obj).filter(key => key.startsWith('x-'));

    if (keys.length === 0) {
      return undefined;
    }

    keys.forEach(key => (extensions[key] = obj[key]));

    return extensions;
  }

  makeDeclarationGlobal(name: string, node: AstNodeType): { declaration: AstNodeDeclaration; refNode: AstNodeTypeReference } {
    const refName = `#/components/generated/${name}`;
    const modifiers = node.modifiers;
    node.modifiers = {};
    const declaration = new AstNodeDeclaration(name, name, node, modifiers, refName);
    const refNode = new AstNodeTypeReference(refName, {});
    return { declaration, refNode };
  }

  makeResponseGlobal(operationId: string, response: AstNodeTypeResponse): AstNodeDeclaration[] {
    const declarations: AstNodeDeclaration[] = [];

    if (response.content && IsContentNode(response.content) && !IsReferenceNode(response.content.contentType)) {
      const { declaration, refNode } = this.makeDeclarationGlobal(`${operationId}Response`, response.content.contentType);

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

      const { declaration, refNode } = this.makeDeclarationGlobal(`${operationId}HeaderResponse`, response.headers);

      declarations.push(declaration);
      response.headers = refNode;
    }

    return declarations;
  }

  makeOperationDeclarationsGlobal(ast: AbstractSyntaxTree): AbstractSyntaxTree {
    for (const operation of ast.operations) {
      const operationId = operation.identifier.value;

      if (operation.responses) {
        const responses = operation.responses;
        if (IsResponseNode(responses)) {
          ast.declarations.push(...this.makeResponseGlobal(operationId, responses));
        } else if (IsUnionNode(responses)) {
          const { declaration, refNode } = this.makeDeclarationGlobal(`${operationId}Response`, responses);
          ast.declarations.push(declaration);
          operation.responses = refNode;
        }
      }

      if (!IsRequestNode(operation.request)) {
        continue;
      }

      if (operation.request.pathParameters && !IsReferenceNode(operation.request.pathParameters)) {
        const { declaration, refNode } = this.makeDeclarationGlobal(`${operationId}PathParameter`, operation.request.pathParameters);

        ast.declarations.push(declaration);
        operation.request.pathParameters = refNode;
      }

      if (operation.request.cookieParameters && !IsReferenceNode(operation.request.cookieParameters)) {
        const { declaration, refNode } = this.makeDeclarationGlobal(`${operationId}CookieParameter`, operation.request.cookieParameters);

        ast.declarations.push(declaration);
        operation.request.cookieParameters = refNode;
      }

      if (operation.request.headerParameters && !IsReferenceNode(operation.request.headerParameters)) {
        const { declaration, refNode } = this.makeDeclarationGlobal(`${operationId}HeaderParameter`, operation.request.headerParameters);

        ast.declarations.push(declaration);
        operation.request.headerParameters = refNode;
      }

      if (operation.request.queryParameters && !IsReferenceNode(operation.request.queryParameters)) {
        const { declaration, refNode } = this.makeDeclarationGlobal(`${operationId}QueryParameter`, operation.request.queryParameters);

        ast.declarations.push(declaration);
        operation.request.queryParameters = refNode;
      }

      if (operation.request.body && !IsReferenceNode(operation.request.body)) {
        const { declaration, refNode } = this.makeDeclarationGlobal(`${operationId}Body`, operation.request.body);

        ast.declarations.push(declaration);
        operation.request.body = refNode;
      }
    }

    return ast;
  }
}
