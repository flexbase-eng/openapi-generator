import { ParsedNode } from './parsed.node';

export interface Tag extends ParsedNode {
  name: string;
  description?: string;
}
