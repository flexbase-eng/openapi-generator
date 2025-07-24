import { ParsedNode } from './parsed.node.js';

export interface Union extends ParsedNode {
  definitions: ParsedNode[];
  discriminatorPropertyName?: string;
  discriminatorMapping?: Record<string, ParsedNode>;
}

export const isUnion = (value: ParsedNode): value is Union => {
  return value.type === 'union';
};
