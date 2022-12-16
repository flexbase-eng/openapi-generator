import { Declaration } from './ast.declaration';
import { Node } from './ast.node';

export interface ObjectNode extends Node {
  properties: Array<PropertyDeclaration>;
}

export interface ObjectExpression extends ObjectNode {
  node: 'ObjectExpression';
}

export interface PropertyDeclaration extends Declaration {
  node: 'PropertyDeclaration';
}

export function IsObjectExpression(node: Node): node is ObjectExpression {
  return node.node === 'ObjectExpression';
}

export function IsPropertyDeclaration(node: Node): node is PropertyDeclaration {
  return node.node === 'PropertyDeclaration';
}
