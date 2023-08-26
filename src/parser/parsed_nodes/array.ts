import { Modifiers } from './modifiers';
import { ParsedNode } from './parsed.node';

export interface ArrayNode extends ParsedNode {
  definition: ParsedNode;
}

export interface ArrayItemNode extends ParsedNode {
  definition: ParsedNode;
}
