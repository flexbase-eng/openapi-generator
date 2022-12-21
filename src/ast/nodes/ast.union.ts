import { Expression } from './ast.expression';
import { Node } from './ast.node';

export interface UnionNode extends Node {
  elements: Expression[];
}

export interface UnionExpression extends UnionNode {
  node: 'UnionExpression';
}

export function IsUnionExpression(node: Node): node is UnionExpression {
  return node.node === 'UnionExpression';
}
