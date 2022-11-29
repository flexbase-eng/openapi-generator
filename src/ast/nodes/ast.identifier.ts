import { Node } from './ast.node';

export interface Identifier extends Node {
  node: 'Identifier';
  name: string;
}
