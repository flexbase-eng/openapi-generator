import { ParsedNode } from './parsed.node.js';
import { PathItem } from './path.js';
import { Reference } from './reference.js';

export interface Callback extends ParsedNode {
  name: string;
  definition: PathItem | Reference;
}

export const isCallback = (value: ParsedNode): value is Callback => {
  return value.type === 'callback';
};
