import { Expression } from './ast.expression';
import { Node } from './ast.node';

export interface UnionNode extends Node {
  elements: Expression[];
}

export interface UnionExpression extends UnionNode {
  node: 'UnionExpression';
}
