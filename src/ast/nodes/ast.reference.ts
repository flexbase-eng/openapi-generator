import { Node } from './ast.node';

export interface Reference extends Node {
  node: 'Reference';
  refName: string;
}
