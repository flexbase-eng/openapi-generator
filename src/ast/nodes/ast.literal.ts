import { Node } from './ast.node';

export interface Literal extends Node {
  node: 'Literal';
  value: string | boolean | null | number;
}
