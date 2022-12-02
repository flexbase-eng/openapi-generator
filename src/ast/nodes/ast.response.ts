import { Expression } from './ast.expression';

export interface ResponseNode extends Node {
  headers?: Expression;
  responses?: Expression[];
}

export interface ResponseExpression extends ResponseNode {
  node: 'ResponseExpression';
  statusCode: string;
}
