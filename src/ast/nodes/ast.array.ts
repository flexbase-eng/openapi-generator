import { Expression } from './ast.expression';
import { Node } from './ast.node';

export interface ArrayNode extends Node {
  elements: Expression;
}

export interface ArrayExpression extends ArrayNode {
  node: 'ArrayExpression';
}

export function IsArrayExpression(node: Node): node is ArrayExpression {
  return node.node === 'ArrayExpression';
}
