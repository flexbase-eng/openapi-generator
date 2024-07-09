import { ParsedNode } from './parsed.node.js';

export interface Tag extends ParsedNode {
  name: string;
  description?: string;
}
