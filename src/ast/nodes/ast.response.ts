import { Expression } from './ast.expression';
import { Node } from './ast.node';

export interface ResponseNode extends Node {
  headers?: Expression;
  responses?: Expression[];
}

export interface ResponseExpression extends ResponseNode {
  node: 'ResponseExpression';
  statusCode: string;
}

export function IsResponseExpression(node: Node): node is ResponseExpression {
  return node.node === 'ResponseExpression';
}
