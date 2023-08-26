import { Modifiers } from './modifiers';
import { ParsedNode } from './parsed.node';

export type PrimativeTypes = 'string' | 'number' | 'boolean' | 'integer' | 'null';

export interface Primative extends ParsedNode {
  type: PrimativeTypes;
  modifiers?: Modifiers;
}
