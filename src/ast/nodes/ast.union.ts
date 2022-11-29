import { DeclarationNode } from './ast.declaration';
import { Expression } from './ast.expression';
import { Node } from './ast.node';

export interface UnionNode extends Node {
  elements: Expression;
}

export interface UnionDeclaration extends UnionNode, DeclarationNode {
  node: 'UnionDeclaration';
}

export interface UnionExpression extends UnionNode {
  node: 'UnionExpression';
}
