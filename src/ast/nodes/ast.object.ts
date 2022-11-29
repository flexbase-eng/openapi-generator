import { DeclarationNode } from './ast.declaration';
import { Expression } from './ast.expression';
import { Identifier } from './ast.identifier';
import { Node } from './ast.node';

export interface ObjectNode extends Node {
  properties: Array<Property>;
}

export interface ObjectDeclaration extends ObjectNode, DeclarationNode {
  node: 'ObjectDeclaration';
}

export interface ObjectExpression extends ObjectNode {
  node: 'ObjectExpression';
}

export interface Property extends Node {
  node: 'Property';
  key: Identifier;
  type: Expression;
  value?: Expression;
}
