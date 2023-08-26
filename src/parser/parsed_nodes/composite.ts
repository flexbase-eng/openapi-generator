import { Modifiers } from './modifiers';
import { ParsedNode } from './parsed.node';

export interface Composite extends ParsedNode {
  definitions: ParsedNode[];
}
