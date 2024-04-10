import { ParsedNode } from './parsed.node';

export interface Composite extends ParsedNode {
  definitions: ParsedNode[];
}

export const isComposite = (value: ParsedNode): value is Composite => {
  return value.type === 'composite';
};
