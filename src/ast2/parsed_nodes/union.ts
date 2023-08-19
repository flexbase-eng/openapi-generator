import { Modifiers } from './modifiers';
import { ParsedNode } from './parsed.node';

export interface Union extends ParsedNode {
  modifiers: Modifiers;
  definitions: ParsedNode[];
}
