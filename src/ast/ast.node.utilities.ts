import { AstNodeDeclaration } from './nodes/ast.node.declaration';
import { AstNodeLiteral } from './nodes/ast.node.literal';
import { AstNodeOperation } from './nodes/ast.node.operation';
import { AstNodeTypeArray } from './nodes/ast.node.type.array';
import { AstNodeTypeBody } from './nodes/ast.node.type.body';
import { AstNodeTypeComposite } from './nodes/ast.node.type.composite';
import { AstNodeTypeContent } from './nodes/ast.node.type.content';
import { AstNodeTypeObject } from './nodes/ast.node.type.object';
import { AstNodeTypeOmit } from './nodes/ast.node.type.omit';
import { AstNodeTypePrimative } from './nodes/ast.node.type.primative';
import { AstNodeTypeReference } from './nodes/ast.node.type.reference';
import { AstNodeTypeRequest } from './nodes/ast.node.type.request';
import { AstNodeTypeResponse } from './nodes/ast.node.type.response';
import { AstNodeTypeUnion } from './nodes/ast.node.type.union';

export function IsObjectNode(test: any): test is AstNodeTypeObject {
  return test?.kind === 'type' && test?.kindType === 'object';
}

export function IsArrayNode(test: any): test is AstNodeTypeArray {
  return test?.kind === 'type' && test?.kindType === 'array';
}

export function IsCompositeNode(test: any): test is AstNodeTypeComposite {
  return test?.kind === 'type' && test?.kindType === 'composite';
}

export function IsUnionNode(test: any): test is AstNodeTypeUnion {
  return test?.kind === 'type' && test?.kindType === 'union';
}

export function IsReferenceNode(test: any): test is AstNodeTypeReference {
  return test?.kind === 'type' && test?.kindType === 'reference';
}

export function IsPrimativeNode(test: any): test is AstNodeTypePrimative {
  return test?.kind === 'type' && test?.kindType === 'primative';
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
  return test?.kind === 'type' && test?.kindType === 'response';
}

export function IsRequestNode(test: any): test is AstNodeTypeRequest {
  return test?.kind === 'type' && test?.kindType === 'request';
}

export function IsContentNode(test: any): test is AstNodeTypeContent {
  return test?.kind === 'type' && test?.kindType === 'content';
}

export function IsBodyNode(test: any): test is AstNodeTypeBody {
  return test?.kind === 'type' && test?.kindType === 'body';
}

export function IsOmitNode(test: any): test is AstNodeTypeOmit {
  return test?.kind === 'type' && test?.kindType === 'omit';
}
