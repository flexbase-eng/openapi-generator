import { DeclarationNode } from './ast.declaration';
import { Expression } from './ast.expression';
import { Node } from './ast.node';

export interface CompositeNode extends Node {
  elements: Expression[];
}

export interface CompositeDeclaration extends CompositeNode, DeclarationNode {
  node: 'CompositeDeclaration';
}

export interface CompositeExpression extends CompositeNode {
  node: 'CompositeExpression';
}
