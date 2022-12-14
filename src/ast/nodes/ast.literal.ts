import { Node } from './ast.node';

export interface Literal extends Node {
  value: string | boolean | null | number;
}

export interface LiteralExpression extends Literal {
  node: 'LiteralExpression';
}

export function IsLiteralExpression(node: Node): node is LiteralExpression {
  return node.node === 'LiteralExpression';
}
