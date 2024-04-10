import { compareModifiers } from './modifiers';
import { ParsedNode } from './parsed.node';

export type PrimativeTypes = 'string' | 'number' | 'boolean' | 'integer' | 'null';

export interface Primative extends ParsedNode {
  type: PrimativeTypes;
}

export const isPrimative = (value: ParsedNode): value is Primative => {
  return ['string', 'number', 'boolean', 'integer', 'null'].includes(value.type);
};

export const comparePrimatives = (a: Primative, b: Primative): boolean => {
  return a.type === b.type && compareModifiers(a, b);
};
