import { Identifier } from './ast.identifier';
import { Node } from './ast.node';

export interface TODO extends Node {
  node: 'TODO';
  id?: Identifier;
  description: string;
}
