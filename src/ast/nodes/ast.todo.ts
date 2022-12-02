import { Node } from './ast.node';

export interface TodoNode extends Node {
  what: string;
}

export interface TodoExpression extends TodoNode {
  node: 'TodoExpression';
}
