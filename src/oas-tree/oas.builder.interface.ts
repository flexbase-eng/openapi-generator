import { OpenAPIV3 } from 'openapi-types';
import { OpenApiSpecTree } from './oas.tree';
import { OasNodeDeclaration, ParameterLocations } from './nodes/oas.node.declaration';
import { OasNodeOperation } from './nodes/oas.node.operation';
import { OasNodeType } from './nodes/oas.node.type';
import { OasNodeTypeResponse } from './nodes/oas.node.type.response';

export interface ParameterNodes {
  queryNodes: OasNodeType[];
  headerNodes: OasNodeType[];
  pathNodes: OasNodeType[];
  cookieNodes: OasNodeType[];
}

export interface ParameterLocationAndNode {
  location: ParameterLocations;
  type: OasNodeType;
}

export interface IOpenApiSpecBuilder {
  generateOasTree(document: OpenAPIV3.Document): OpenApiSpecTree;
  generateDeclarations(components: OpenAPIV3.ComponentsObject): OasNodeDeclaration[];
  generateTypeFromSchema(schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject): OasNodeType;
  generateOperations(pathObject: OpenAPIV3.PathsObject, modelMappings: Map<string, OasNodeDeclaration>): OasNodeOperation[];
  generateOperationFromPathItem(
    pathPattern: string,
    pathItem: OpenAPIV3.PathItemObject,
    modelMappings: Map<string, OasNodeDeclaration>
  ): OasNodeOperation[];
  generateParameters(
    parameters: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[] | undefined,
    modelMappings: Map<string, OasNodeDeclaration>
  ): ParameterNodes;
  generateParameter(parameter: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject): ParameterLocationAndNode | undefined;
  generateHeader(name: string, header: OpenAPIV3.ReferenceObject | OpenAPIV3.HeaderObject): OasNodeType;
  generateResponse(code: string, response: OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject): OasNodeTypeResponse | undefined;
  generateResponses(responses: OpenAPIV3.ResponsesObject): OasNodeType | OasNodeType[] | undefined;
  generateRequestBody(request: OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject, modelMappings: Map<string, OasNodeDeclaration>): OasNodeType;
  createDeclarationMappings(declarations: OasNodeDeclaration[]): Map<string, OasNodeDeclaration>;
  makeOperationDeclarationsGlobal(ast: OpenApiSpecTree): OpenApiSpecTree;
}
