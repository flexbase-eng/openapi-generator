import { Node } from './ast.node';

export interface IdentifierExpression extends Node {
  node: 'IdentifierExpression';
  name: string;
}
