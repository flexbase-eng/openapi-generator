import { ParsedNode } from './parsed.node';
import { PathItem } from './path.item';
import { Reference } from './reference';

export interface Path extends ParsedNode {
  name: string;
  definition?: PathItem | Reference;
}
