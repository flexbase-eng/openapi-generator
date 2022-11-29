import { DeclarationNode } from './ast.declaration';
import { Expression } from './ast.expression';
import { Node } from './ast.node';

export interface ArrayNode extends Node {
  elements: Expression;
}

export interface ArrayDeclaration extends ArrayNode, DeclarationNode {
  node: 'ArrayDeclaration';
}

export interface ArrayExpression extends ArrayNode {
  node: 'ArrayExpression';
}
