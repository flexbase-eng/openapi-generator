import { Modifiers } from './modifiers';
import { ParsedNode } from './parsed.node';

export interface ArrayNode extends ParsedNode {
  modifiers: Modifiers;
}
