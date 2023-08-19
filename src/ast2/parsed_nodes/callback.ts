import { ParsedNode } from './parsed.node';
import { PathItem } from './path.item';
import { Reference } from './reference';

export interface Callback extends ParsedNode {
  name: string;
  definition: PathItem | Reference;
}

export interface CallbackGroup extends ParsedNode {
  name: string;
  callbacks: Callback[] | Reference;
}
