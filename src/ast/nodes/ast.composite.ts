import { Expression } from './ast.expression';
import { Node } from './ast.node';

export interface CompositeNode extends Node {
  elements: Expression[];
}

export interface CompositeExpression extends CompositeNode {
  node: 'CompositeExpression';
}
