import { ParsedNode } from './parsed.node';

export interface Reference extends ParsedNode {
  reference: string;
  summary?: string;
  description?: string;
}
