import { Expression } from './ast.expression';
import { Node } from './ast.node';

export interface ArrayNode extends Node {
  elements: Expression;
}

export interface ArrayExpression extends ArrayNode {
  node: 'ArrayExpression';
}
