import { Expression } from './ast.expression';
import { Node } from './ast.node';

export interface ResponseExpression extends Node {
  node: 'ResponseExpression';
  headers?: Expression;
  bodies?: Expression[];
}

export interface OperationResponseExpression extends Node {
  node: 'OperationResponseExpression';
  statusCode: string;
  response: Expression;
}

export function IsResponseExpression(node: Node): node is ResponseExpression {
  return node.node === 'ResponseExpression';
}

export function IsOperationResponseExpression(node: Node): node is OperationResponseExpression {
  return node.node === 'OperationResponseExpression';
}
