import { Expression } from './ast.expression';

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
