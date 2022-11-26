import { OpenAPIV3 } from 'openapi-types';
import { AbstractSyntaxTree } from './ast';
import { AstNodeDeclaration, ParameterLocations } from './nodes/ast.node.declaration';
import { AstNodeOperation } from './nodes/ast.node.operation';
import { AstNodeType } from './nodes/ast.node.type';
import { AstNodeTypeResponse } from './nodes/ast.node.type.response';

export interface ParameterNodes {
  queryNodes: AstNodeType[];
  headerNodes: AstNodeType[];
  pathNodes: AstNodeType[];
  cookieNodes: AstNodeType[];
}

export interface ParameterLocationAndNode {
  location: ParameterLocations;
  type: AstNodeType;
}

export interface IAbstractSyntaxTreeBuilder {
  generateAst(document: OpenAPIV3.Document): AbstractSyntaxTree;
  generateDeclarations(components: OpenAPIV3.ComponentsObject): AstNodeDeclaration[];
  generateTypeFromSchema(schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject): AstNodeType;
  generateOperations(pathObject: OpenAPIV3.PathsObject, modelMappings: Map<string, AstNodeDeclaration>): AstNodeOperation[];
  generateOperationFromPathItem(
    pathPattern: string,
    pathItem: OpenAPIV3.PathItemObject,
    modelMappings: Map<string, AstNodeDeclaration>
  ): AstNodeOperation[];
  generateParameters(
    parameters: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[] | undefined,
    modelMappings: Map<string, AstNodeDeclaration>
  ): ParameterNodes;
  generateParameter(parameter: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject): ParameterLocationAndNode | undefined;
  generateHeader(name: string, header: OpenAPIV3.ReferenceObject | OpenAPIV3.HeaderObject): AstNodeType;
  generateResponse(code: string, response: OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject): AstNodeTypeResponse | undefined;
  generateResponses(responses: OpenAPIV3.ResponsesObject): AstNodeType | undefined;
  generateRequestBody(request: OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject, modelMappings: Map<string, AstNodeDeclaration>): AstNodeType;
  createDeclarationMappings(declarations: AstNodeDeclaration[]): Map<string, AstNodeDeclaration>;
  makeOperationDeclarationsGlobal(ast: AbstractSyntaxTree): AbstractSyntaxTree;
}
