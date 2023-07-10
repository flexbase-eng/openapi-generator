import { OpenAPIV3 } from 'openapi-types';
import {
  IsArraySchemaObject,
  IsReferenceObject,
  IsSecurityApiKey,
  IsSecurityHttp,
  IsSecurityOAuth2,
  IsSecurityOpenIdConnect,
} from '../utilities/openapi.utilities';
import { OpenApiSpecTree } from './oas.tree';
import { OasNode } from './nodes/oas.node';
import { OasNodeDeclaration, DeclarationType, ParameterLocations } from './nodes/oas.node.declaration';
import { OasNodeTypeReference } from './nodes/oas.node.type.reference';
import { OasNodeTypeObject } from './nodes/oas.node.type.object';
import { OasNodeType } from './nodes/oas.node.type';
import { OasNodeTypePrimative } from './nodes/oas.node.type.primative';
import { OasNodeTypeComposite } from './nodes/oas.node.type.composite';
import { OasNodeTypeArray } from './nodes/oas.node.type.array';
import { OasNodeOperation, OasNodeOperationHttpMethod } from './nodes/oas.node.operation';
import {
  IsArrayNode,
  IsCompositeNode,
  IsDeclarationNode,
  IsObjectNode,
  IsReferenceNode,
  IsRequestNode,
  IsResponseContentNode,
  IsResponseNode,
  IsUnionNode,
} from './oas.node.utilities';
import { OasNodeTypeResponse } from './nodes/oas.node.type.response';
import { OasNodeTypeContent } from './nodes/oas.node.type.content';
import { OasNodeTypeRequest } from './nodes/oas.node.type.request';
import { OasNodeTypeBody } from './nodes/oas.node.type.body';
import { OasNodeTypeUnion } from './nodes/oas.node.type.union';
import { OasNodeModifiers } from './nodes/oas.node.modifiers';
import { OasNodeTypeOmit } from './nodes/oas.node.type.omit';
import { OasNodeTag } from './nodes/oas.node.tag';
import { capitalize } from '../utilities/string.utilities';
import { IOpenApiSpecBuilder, ParameterLocationAndNode, ParameterNodes } from './oas.builder.interface';
import { Logger } from '@flexbase/logger';
import { OasNodeTypeResponseContent } from './nodes/oas.node.type.response.content';
import { OasNodeTypeOperationResponse } from './nodes/oas.node.type.operation.response';
import { OasNodeTypeSecurityOAuth2, OasNodeTypeSecurityOAuth2Flow } from './nodes/oas.node.type.security.oauth2';
import { OasNodeTypeSecurityHttp } from './nodes/oas.node.type.security.http';
import { OasNodeTypeSecurityApiKey, SecurityLocation } from './nodes/oas.node.type.security.apikey';
import { OasNodeTypeSecurityOpenIdConnect } from './nodes/oas.node.type.security.openidconnect';
import { OasNodeTypeOperationSecurity } from './nodes/oas.node.type.operation.security';

export class OpenApiSpecBuilder implements IOpenApiSpecBuilder {
  constructor(private readonly _logger: Logger) {}

  private nameChecker(name: string): void {
    // const valid = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/g.test(name);
    const valid = /[a-zA-Z_$][a-zA-Z_$0-9]*$/g.test(name);
    if (!valid) {
      this._logger.info(`${name} may not be a valid variable identifier`);
    }
  }

  generateOasTree(document: OpenAPIV3.Document): OpenApiSpecTree {
    const declarations: OasNodeDeclaration[] = document.components ? this.generateDeclarations(document.components) : [];
    const operations: OasNodeOperation[] = document.paths
      ? this.generateOperations(document.paths, this.createDeclarationMappings(declarations))
      : [];
    const title = document.info.title;
    const description = document.info.description;
    const version = document.info.version;
    const tags = document.tags ? document.tags.map(tag => new OasNodeTag(tag.name, tag.description)) : undefined;

    return { declarations, operations, title, description, version, tags };
  }

  generateDeclarations(components: OpenAPIV3.ComponentsObject): OasNodeDeclaration[] {
    const declarations: OasNodeDeclaration[] = [];
    const modelMappings = new Map<string, OasNodeDeclaration>();

    if (components.schemas) {
      const records = Object.entries(components.schemas);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const refName = `#/components/schemas/${name}`;
        this.nameChecker(name);

        const nodeType = this.generateTypeFromSchema(schema);
        const modifiers = nodeType.modifiers;
        nodeType.modifiers = {};
        const declaration = new OasNodeDeclaration(name, 'model', nodeType, modifiers, refName);
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
        this.nameChecker(name);

        const nodeType = this.generateRequestBody(schema, modelMappings);
        const modifiers = nodeType.modifiers;
        nodeType.modifiers = {};

        declarations.push(new OasNodeDeclaration(name, 'request', nodeType, modifiers, refName));
      }
    }

    if (components.responses) {
      const records = Object.entries(components.responses);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const refName = `#/components/responses/${name}`;
        this.nameChecker(name);

        const nodeType = this.generateResponse(schema);
        if (!nodeType) {
          continue;
        }

        const modifiers = nodeType.modifiers;
        nodeType.modifiers = {};
        declarations.push(new OasNodeDeclaration(name, 'response', nodeType, modifiers, refName));
      }
    }

    if (components.parameters) {
      const records = Object.entries(components.parameters);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const refName = `#/components/parameters/${name}`;
        this.nameChecker(name);

        const parameterAndLocation = this.generateParameter(schema);
        if (!parameterAndLocation) {
          continue;
        }

        const type = parameterAndLocation.type;
        const location = parameterAndLocation.location;

        const modifiers = type.modifiers;
        type.modifiers = {};
        declarations.push(new OasNodeDeclaration(name, 'parameter', type, modifiers, refName, location));
      }
    }

    if (components.securitySchemes) {
      const records = Object.entries(components.securitySchemes);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const refName = `#/components/securitySchemes/${name}`;
        this.nameChecker(name);

        const nodeType = this.generateSecurityScheme(schema);
        if (!nodeType) {
          continue;
        }
        const modifiers = nodeType.modifiers;
        nodeType.modifiers = {};
        declarations.push(new OasNodeDeclaration(name, 'security', nodeType, modifiers, refName));
      }
    }

    return declarations;
  }

  generateTypeFromSchema(schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject): OasNodeType {
    if (IsReferenceObject(schema)) {
      if (!schema.$ref.startsWith('#')) {
        this._logger.info(schema.$ref);
      }
      return new OasNodeTypeReference(schema.$ref, {});
    }

    const modifiers: OasNodeModifiers = {
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
      examples: schema.example,
    };

    if (IsArraySchemaObject(schema)) {
      const arrayType = this.generateTypeFromSchema(schema.items);
      return new OasNodeTypeArray(arrayType, modifiers);
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
      const fields: OasNodeDeclaration[] = [];

      if (schema.properties) {
        const propEntries = Object.entries(schema.properties);
        for (const propEntry of propEntries) {
          const identifier = propEntry[0];
          this.nameChecker(identifier);

          const propertyType = this.generateTypeFromSchema(propEntry[1]);

          const isRequired = schema.required?.find(x => x === identifier) !== undefined;
          if (isRequired) {
            propertyType.modifiers.required = isRequired;
          }

          const modifiers = propertyType.modifiers;
          propertyType.modifiers = {};
          fields.push(new OasNodeDeclaration(identifier, 'inline', propertyType, modifiers));
        }
      }

      return new OasNodeTypeObject(fields, modifiers);
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
      const types: OasNodeType[] = [];
      for (const schemaType of schemaTypeArray) {
        types.push(this.createPrimativeNode(schemaType, {}));
      }

      return this.createUnionNode(types, modifiers);
    }

    this._logger.warn('Unknown schema type', schema);
    return new OasNodeTypePrimative('void', {});
  }

  generateOperations(pathObject: OpenAPIV3.PathsObject, modelMappings: Map<string, OasNodeDeclaration>): OasNodeOperation[] {
    const nodeOperations: OasNodeOperation[] = [];
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
    modelMappings: Map<string, OasNodeDeclaration>
  ): OasNodeOperation[] {
    const nodeOperations: OasNodeOperation[] = [];

    const { queryNodes, headerNodes, pathNodes, cookieNodes } = this.generateParameters(pathItem.parameters, modelMappings);

    for (const method in OpenAPIV3.HttpMethods) {
      const operationObject = pathItem[method.toLowerCase() as OpenAPIV3.HttpMethods];
      if (!operationObject) {
        continue;
      }

      const title = operationObject.summary ?? pathItem.summary;
      const description = operationObject.description ?? pathItem.description;
      const deprecated = operationObject.deprecated;

      const security = this.generateSecurity(operationObject.security);

      let returns: string[] | undefined;
      const extensions = this.getExtensions(operationObject);

      const responses = this.generateResponses(operationObject.responses);

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

      const request = new OasNodeTypeRequest(requestBody, path, cookie, header, query, { description, title });

      if (operationObject.operationId) this.nameChecker(operationObject.operationId);

      const nodeOperation = new OasNodeOperation(
        (operationObject.operationId ?? 'OperationId_NOTDEFINED').replace(/-./g, x => x[1].toUpperCase()),
        capitalize(method) as OasNodeOperationHttpMethod,
        pathPattern,
        responses,
        request,
        security,
        { title, description, deprecated, returns, extensions, tags: operationObject.tags }
      );
      nodeOperations.push(nodeOperation);
    }

    return nodeOperations;
  }

  generateParameters(
    parameters: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[] | undefined,
    modelMappings: Map<string, OasNodeDeclaration>
  ): ParameterNodes {
    const queryNodes: OasNodeType[] = [];
    const headerNodes: OasNodeType[] = [];
    const pathNodes: OasNodeType[] = [];
    const cookieNodes: OasNodeType[] = [];

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
    this.nameChecker(name);
    const location = parameter.in as ParameterLocations;

    if (!name) {
      this._logger.warn(`Missing ${location} parameter name`);
      return undefined;
    }

    const nodeType = parameter.schema ? this.generateTypeFromSchema(parameter.schema) : new OasNodeTypePrimative('void', {});
    nodeType.modifiers.required = parameter.required;
    nodeType.modifiers.deprecated = parameter.deprecated;

    const required = parameter.required;
    const deprecated = parameter.deprecated;
    const description = parameter.description;

    const declaration = new OasNodeDeclaration(name, 'parameter', nodeType, { description, required, deprecated });

    return { location, type: new OasNodeTypeObject([declaration], {}) };
  }

  generateHeader(name: string, header: OpenAPIV3.ReferenceObject | OpenAPIV3.HeaderObject): OasNodeType {
    if (IsReferenceObject(header)) {
      return this.generateTypeFromSchema(header);
    }

    const nodeType = header.schema ? this.generateTypeFromSchema(header.schema) : new OasNodeTypePrimative('void', {});
    nodeType.modifiers.required = header.required;
    nodeType.modifiers.deprecated = header.deprecated;

    const required = header.required;
    const deprecated = header.deprecated;
    const description = header.description;

    const declaration = new OasNodeDeclaration(name, 'parameter', nodeType, { description, required, deprecated });

    return new OasNodeTypeObject([declaration], {});
  }

  generateResponse(response: OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject): OasNodeType | undefined {
    if (IsReferenceObject(response)) {
      return new OasNodeTypeReference(response.$ref, {});
    }

    const description = response.description;
    const contentNodes: OasNodeTypeResponseContent[] = [];

    let headerNode: OasNodeType | undefined;

    if (response.headers) {
      const headersNodes: OasNodeType[] = [];
      const responseHeaders = Object.keys(response.headers);
      for (const header of responseHeaders) {
        headersNodes.push(this.generateHeader(header, response.headers[header]));
      }
      headerNode = responseHeaders.length > 0 ? this.createCompositeNode(headersNodes, {}) : undefined;
    }

    if (response.content) {
      const contentMediaTypes = Object.keys(response.content);
      for (const mediaType of contentMediaTypes) {
        const schema = response.content[mediaType].schema;
        if (schema) {
          const nodeType = this.generateTypeFromSchema(schema);
          contentNodes.push(new OasNodeTypeResponseContent(mediaType, nodeType, headerNode, {}));
        }
      }
    }

    if (response.links) {
      this._logger.warn('oas generation for response object links is not implemented yet');
    }

    //const content = contentNodes.length === 0 ? undefined : contentNodes.length > 1 ? contentNodes : contentNodes[0]; //this.createUnionNode(contentNodes, { description });

    return new OasNodeTypeResponse(contentNodes, { description });
  }

  generateSecurity(security?: OpenAPIV3.SecurityRequirementObject[]): OasNodeType[] | undefined {
    if (security === undefined) {
      return undefined;
    }

    const securityItems = security.flatMap(x => Object.entries(x));
    if (securityItems.length === 0) {
      return [];
    }

    const operationSecurity: OasNodeType[] = [];

    for (const securityItem of securityItems) {
      const securityScheme = securityItem[0];
      const securityObject = securityItem[1];

      operationSecurity.push(new OasNodeTypeOperationSecurity(`#/components/securitySchemes/${securityScheme}`, securityObject, {}));
    }

    return operationSecurity;
  }

  generateResponses(responses: OpenAPIV3.ResponsesObject): OasNodeType[] | undefined {
    const responsesEntities = Object.entries(responses);
    if (responsesEntities.length === 0) {
      return undefined;
    }

    const operationResponses: OasNodeTypeOperationResponse[] = [];

    for (const responseEntry of responsesEntities) {
      const code = responseEntry[0];
      const responseObject = responseEntry[1];

      const responseNode = this.generateResponse(responseObject);

      operationResponses.push(new OasNodeTypeOperationResponse(code, responseNode, {}));
    }

    return operationResponses;
  }

  generateRequestBody(request: OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject, modelMappings: Map<string, OasNodeDeclaration>): OasNodeType {
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
    const contentNodes: OasNodeTypeContent[] = [];
    for (const mediaType of contentMediaTypes) {
      const schema = request.content[mediaType].schema;
      if (schema) {
        const nodeType = this.createOmitNode(this.generateTypeFromSchema(schema), 'readOnly', modelMappings);
        contentNodes.push(new OasNodeTypeContent(mediaType, nodeType, {}));
      }
    }

    return new OasNodeTypeBody(contentNodes, { description, required });
  }

  generateSecurityScheme(securityScheme: OpenAPIV3.SecuritySchemeObject | OpenAPIV3.ReferenceObject): OasNodeType | undefined {
    if (IsReferenceObject(securityScheme)) {
      return this.generateTypeFromSchema(securityScheme);
    }

    if (IsSecurityHttp(securityScheme)) {
      return new OasNodeTypeSecurityHttp(securityScheme.scheme, securityScheme.bearerFormat, { description: securityScheme.description });
    } else if (IsSecurityApiKey(securityScheme)) {
      return new OasNodeTypeSecurityApiKey(securityScheme.name, securityScheme.in as SecurityLocation, {
        description: securityScheme.description,
      });
    } else if (IsSecurityOAuth2(securityScheme)) {
      const implicitFlow = securityScheme.flows.implicit
        ? new OasNodeTypeSecurityOAuth2Flow(
            securityScheme.flows.implicit.authorizationUrl,
            undefined,
            securityScheme.flows.implicit.refreshUrl,
            securityScheme.flows.implicit.scopes
          )
        : undefined;
      const passwordFlow = securityScheme.flows.password
        ? new OasNodeTypeSecurityOAuth2Flow(
            undefined,
            securityScheme.flows.password.tokenUrl,
            securityScheme.flows.password.refreshUrl,
            securityScheme.flows.password.scopes
          )
        : undefined;
      const clientCredentialsFlow = securityScheme.flows.clientCredentials
        ? new OasNodeTypeSecurityOAuth2Flow(
            undefined,
            securityScheme.flows.clientCredentials.tokenUrl,
            securityScheme.flows.clientCredentials.refreshUrl,
            securityScheme.flows.clientCredentials.scopes
          )
        : undefined;
      const authorizationCodeFlow = securityScheme.flows.authorizationCode
        ? new OasNodeTypeSecurityOAuth2Flow(
            securityScheme.flows.authorizationCode.authorizationUrl,
            securityScheme.flows.authorizationCode.tokenUrl,
            securityScheme.flows.authorizationCode.refreshUrl,
            securityScheme.flows.authorizationCode.scopes
          )
        : undefined;

      return new OasNodeTypeSecurityOAuth2(implicitFlow, passwordFlow, clientCredentialsFlow, authorizationCodeFlow, {
        description: securityScheme.description,
      });
    } else if (IsSecurityOpenIdConnect(securityScheme)) {
      return new OasNodeTypeSecurityOpenIdConnect(securityScheme.openIdConnectUrl, { description: securityScheme.description });
    } else {
      this._logger.warn('Unknown security type', securityScheme);
    }

    return undefined;
  }

  createPrimativeNode(primativeType: string, modifiers: OasNodeModifiers): OasNodeType {
    return new OasNodeTypePrimative(primativeType, modifiers);
  }

  createCompositeNode(nodes: OasNodeType[], modifiers: OasNodeModifiers): OasNodeType {
    if (nodes.length === 0) {
      throw new Error('Nodes must not be an empty array');
    }

    const mergeNodes: OasNodeTypeObject[] = [];
    const modelTypes: OasNodeType[] = [];

    for (const node of nodes) {
      if (IsObjectNode(node)) {
        mergeNodes.push(node);
      } else {
        modelTypes.push(node);
      }
    }

    const merged: OasNodeDeclaration[] = [];
    mergeNodes.forEach(x => merged.push(...x.fields));
    if (merged.length > 0) {
      modelTypes.push(new OasNodeTypeObject(merged, {}));
    }

    return modelTypes.length > 1 ? new OasNodeTypeComposite(modelTypes, modifiers) : modelTypes[0];
  }

  createUnionNode(nodes: OasNodeType[], modifiers: OasNodeModifiers): OasNodeType {
    if (nodes.length === 0) {
      throw new Error('Nodes must not be an empty array');
    }

    return nodes.length === 1 ? nodes[0] : new OasNodeTypeUnion(nodes, modifiers);
  }

  createOmitNode(model: OasNodeType, omitType: 'readOnly' | 'writeOnly', modelMappings: Map<string, OasNodeDeclaration>): OasNodeType {
    const omitDeclarations: string[] = [];

    if (IsReferenceNode(model)) {
      const refModel = modelMappings.get(model.identifier.value);
      if (!refModel) {
        this._logger.warn(`${this.createOmitNode.name}: Unable to find reference ${model.identifier.value}`, model);
      } else {
        //return this.createOmitNode(refModel.type, omitType, modelMappings);
        omitDeclarations.push(...this.getOmitDeclarations(refModel.type, omitType));
      }
    } else {
      omitDeclarations.push(...this.getOmitDeclarations(model, omitType));
    }
    // else if (IsObjectNode(model)) {
    //   model.fields.forEach(field => {
    //     if (field.modifiers[omitType] === true) {
    //       omitDeclarations.push(field.identifier.value);
    //     }
    //   });
    // } else if (IsDeclarationNode(model)) {
    //   return this.createOmitNode(model.type, omitType, modelMappings);
    // } else if (IsArrayNode(model)) {
    //   return this.createOmitNode(model.arrayType, omitType, modelMappings);
    // } else if (IsUnionNode(model)) {
    //   this._logger.error(`${this.createOmitNode.name}: need to handle union node`);
    // } else if (IsCompositeNode(model)) {
    //   this._logger.error(`${this.createOmitNode.name}: need to handle composite node`);
    // } else if (!IsPrimativeNode(model)) {
    //   this._logger.error(`${this.createOmitNode.name}: need to handle node`, model);
    // }

    return omitDeclarations.length > 0 ? new OasNodeTypeOmit(model, omitDeclarations, {}) : model;
  }

  getOmitDeclarations(model: OasNode, omitType: 'readOnly' | 'writeOnly'): string[] {
    const omitDeclarations: string[] = [];

    if (IsObjectNode(model)) {
      model.fields.forEach(field => {
        if (field.modifiers[omitType] === true) {
          omitDeclarations.push(field.identifier.value);
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

  createDeclarationMappings(declarations: OasNodeDeclaration[]): Map<string, OasNodeDeclaration> {
    const mapping = new Map<string, OasNodeDeclaration>();

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

  private makeDeclarationGlobal(
    name: string,
    declarationType: DeclarationType,
    node: OasNodeType,
    tags: string[] | undefined,
    parameterLocation?: ParameterLocations
  ): { declaration: OasNodeDeclaration; refNode: OasNodeTypeReference } {
    const refName = `#/components/generated/${parameterLocation ?? declarationType}/${name}`;
    const modifiers = node.modifiers;
    modifiers.tags = tags;
    node.modifiers = {};
    const declaration = new OasNodeDeclaration(name, declarationType, node, modifiers, refName, parameterLocation);
    declaration.isGenerated = true;
    const refNode = new OasNodeTypeReference(refName, {});
    return { declaration, refNode };
  }

  private makeResponseGlobal(operationId: string, response: OasNodeTypeOperationResponse, tags: string[] | undefined): OasNodeDeclaration[] {
    const declarations: OasNodeDeclaration[] = [];

    // swap content array with references
    if (IsResponseNode(response.responses) && response.responses.content) {
      const contentArray: OasNodeType[] = [];
      for (const content of response.responses.content) {
        if (IsResponseContentNode(content)) {
          const { declaration, refNode } = this.makeDeclarationGlobal(`${operationId}`, 'response', content, tags);
          declarations.push(declaration);
          contentArray.push(refNode);
          // if (!IsReferenceNode(content.contentType)) {
          //   const { declaration, refNode } = this.makeDeclarationGlobal(`${operationId}`, 'response', content.contentType, tags);

          //   declarations.push(declaration);
          //   content.contentType = refNode;
          // }
          // if (content.headers && !IsReferenceNode(content.headers)) {
          //   const { declaration, refNode } = this.makeDeclarationGlobal(`${operationId}`, 'parameter', content.headers, tags, 'header');

          //   declarations.push(declaration);
          //   content.headers = refNode;
          // }
        } else {
          contentArray.push(content);
        }
      }

      response.responses.content = contentArray;
    }

    // if (response.headers && !IsReferenceNode(response.headers)) {
    //   const { declaration, refNode } = this.makeDeclarationGlobal(`${operationId}`, 'parameter', response.headers, tags, 'header');

    //   declarations.push(declaration);
    //   response.headers = refNode;
    // }

    return declarations;
  }

  makeOperationDeclarationsGlobal(oas: OpenApiSpecTree): OpenApiSpecTree {
    for (const operation of oas.operations) {
      const operationId = operation.identifier.value;
      const tags = operation.modifiers.tags;

      if (operation.responses) {
        const operationResponses: OasNodeType[] = [];
        for (const responses of operation.responses) {
          if (!IsReferenceNode(responses)) {
            // if (IsOperationResponseNode(responses)) {
            //   oas.declarations.push(...this.makeResponseGlobal(operationId, responses, tags));
            // }
            const { declaration, refNode } = this.makeDeclarationGlobal(`${operationId}`, 'response', responses, tags);
            oas.declarations.push(declaration);
            operationResponses.push(refNode);
          } else {
            operationResponses.push(responses);
          }
        }
        operation.responses = operationResponses;
      }

      if (!IsRequestNode(operation.request)) {
        continue;
      }

      if (operation.request.pathParameters && !IsReferenceNode(operation.request.pathParameters)) {
        const { declaration, refNode } = this.makeDeclarationGlobal(`${operationId}`, 'parameter', operation.request.pathParameters, tags, 'path');

        oas.declarations.push(declaration);
        operation.request.pathParameters = refNode;
      }

      if (operation.request.cookieParameters && !IsReferenceNode(operation.request.cookieParameters)) {
        const { declaration, refNode } = this.makeDeclarationGlobal(
          `${operationId}`,
          'parameter',
          operation.request.cookieParameters,
          tags,
          'cookie'
        );

        oas.declarations.push(declaration);
        operation.request.cookieParameters = refNode;
      }

      if (operation.request.headerParameters && !IsReferenceNode(operation.request.headerParameters)) {
        const { declaration, refNode } = this.makeDeclarationGlobal(
          `${operationId}`,
          'parameter',
          operation.request.headerParameters,
          tags,
          'header'
        );

        oas.declarations.push(declaration);
        operation.request.headerParameters = refNode;
      }

      if (operation.request.queryParameters && !IsReferenceNode(operation.request.queryParameters)) {
        const { declaration, refNode } = this.makeDeclarationGlobal(`${operationId}`, 'parameter', operation.request.queryParameters, tags, 'query');

        oas.declarations.push(declaration);
        operation.request.queryParameters = refNode;
      }

      if (operation.request.body && !IsReferenceNode(operation.request.body)) {
        const { declaration, refNode } = this.makeDeclarationGlobal(`${operationId}`, 'request', operation.request.body, tags);

        oas.declarations.push(declaration);
        operation.request.body = refNode;
      }
    }

    return oas;
  }
}
