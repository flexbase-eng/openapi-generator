import { ParsedNode } from './parsed.node.js';

export interface Composite extends ParsedNode {
  definitions: ParsedNode[];
}

export const isComposite = (value: ParsedNode): value is Composite => {
  return value.type === 'composite';
};
