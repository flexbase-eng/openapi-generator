import { ParsedNode } from './parsed.node';
import { PathItem } from './path';
import { Reference } from './reference';

export interface Callback extends ParsedNode {
  name: string;
  definition: PathItem | Reference;
}
