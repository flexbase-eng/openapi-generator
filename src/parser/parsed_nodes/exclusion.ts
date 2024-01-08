import { ParsedNode } from './parsed.node';

export interface Exclusion extends ParsedNode {
  definition: ParsedNode;
}

export const isExclusion = (value: ParsedNode): value is Exclusion => {
  return value.type === 'exclusion';
};
