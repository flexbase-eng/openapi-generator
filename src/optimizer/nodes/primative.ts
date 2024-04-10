import { OptimizedNode } from './optimized.node';

export type PrimativeTypes = 'string' | 'number' | 'boolean' | 'integer' | 'null';

export interface Primative extends OptimizedNode {
  type: PrimativeTypes;
}

export const isPrimative = (value: OptimizedNode): value is Primative => {
  return ['string', 'number', 'boolean', 'integer', 'null'].includes(value.type);
};
