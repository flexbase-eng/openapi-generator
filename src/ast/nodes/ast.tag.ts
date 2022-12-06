import { Node } from './ast.node';

export interface TagNode extends Node {
  node: 'TagNode';
  name: string;
  description?: string;
}
