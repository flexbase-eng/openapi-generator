import { Modifiers } from './modifiers';
import { ParsedNode } from './parsed.node';

export interface Exclusion extends ParsedNode {
  definition: ParsedNode;
}
