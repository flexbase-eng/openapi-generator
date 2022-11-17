import { AstNodeDeclaration } from './ast.node.declaration';
import { AstNodeLiteral } from './ast.node.literal';
import { AstNodeOperation } from './ast.node.operation';
import { AstNodeTypeArray } from './ast.node.type.array';
import { AstNodeTypeBody } from './ast.node.type.body';
import { AstNodeTypeComposite } from './ast.node.type.composite';
import { AstNodeTypeContent } from './ast.node.type.content';
import { AstNodeTypeObject } from './ast.node.type.object';
import { AstNodeTypeOmit } from './ast.node.type.omit';
import { AstNodeTypePrimative } from './ast.node.type.primative';
import { AstNodeTypeReference } from './ast.node.type.reference';
import { AstNodeTypeRequest } from './ast.node.type.request';
import { AstNodeTypeResponse } from './ast.node.type.response';
import { AstNodeTypeUnion } from './ast.node.type.union';

export function IsObjectNode(test: any): test is AstNodeTypeObject {
  return test?.kind === 'type' && 'fields' in test;
}

export function IsArrayNode(test: any): test is AstNodeTypeArray {
  return test?.kind === 'type' && 'arrayType' in test;
}

export function IsCompositeNode(test: any): test is AstNodeTypeComposite {
  return test?.kind === 'type' && 'compositeTypes' in test;
}

export function IsUnionNode(test: any): test is AstNodeTypeUnion {
  return test?.kind === 'type' && 'unionTypes' in test;
}

export function IsReferenceNode(test: any): test is AstNodeTypeReference {
  return test?.kind === 'type' && 'identifier' in test;
}

export function IsPrimativeNode(test: any): test is AstNodeTypePrimative {
  return test?.kind === 'type' && 'primativeType' in test;
}

export function IsDeclarationNode(test: any): test is AstNodeDeclaration {
  return test?.kind === 'declaration';
}

export function IsLiteralNode(test: any): test is AstNodeLiteral {
  return test?.kind === 'literal';
}

export function IsOperationNode(test: any): test is AstNodeOperation {
  return test?.kind === 'operation';
}

export function IsResponseNode(test: any): test is AstNodeTypeResponse {
  return test?.kind === 'type' && 'statusCode' in test && 'content' in test && 'headers' in test;
}

export function IsRequestNode(test: any): test is AstNodeTypeRequest {
  return test?.kind === 'type' && 'body' in test && 'pathParameters' in test;
}

export function IsContentNode(test: any): test is AstNodeTypeContent {
  return test?.kind === 'type' && 'mediaType' in test && 'contentType' in test;
}

export function IsBodyNode(test: any): test is AstNodeTypeBody {
  return test?.kind === 'type' && 'contents' in test;
}

export function IsOmitNode(test: any): test is AstNodeTypeOmit {
  return test?.kind === 'type' && 'originalType' in test && 'omitFields' in test;
}
