import { Expression } from './ast.expression';
import { Node } from './ast.node';

export interface Request extends Node {
  bodies?: Expression[];
}

export interface RequestExpression extends Request {
  node: 'RequestExpression';
  pathParameters?: Expression;
  cookieParameters?: Expression;
  headerParameters?: Expression;
  queryParameters?: Expression;
}

export function IsRequestExpression(node: Node): node is RequestExpression {
  return node.node === 'RequestExpression';
}
