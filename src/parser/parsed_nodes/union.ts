import { ParsedNode } from './parsed.node';

export interface Union extends ParsedNode {
  definitions: ParsedNode[];
}

export const isUnion = (value: ParsedNode): value is Union => {
  return value.type === 'union';
};
