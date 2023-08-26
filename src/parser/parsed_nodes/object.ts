import { Modifiers } from './modifiers';
import { ParsedNode } from './parsed.node';

export interface ObjectNode extends ParsedNode {
  properties: Property[];
}

export interface Property extends ParsedNode {
  name: string;
  required: boolean;
  definition: ParsedNode;
}
