import { ParsedNode } from './parsed.node.js';

export interface Xor extends ParsedNode {
  definitions: ParsedNode[];
  discriminatorPropertyName?: string;
  discriminatorMapping?: Record<string, ParsedNode>;
}

export const isXor = (value: ParsedNode): value is Xor => {
  return value.type === 'xor';
};
