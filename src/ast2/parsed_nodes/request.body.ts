import { MediaContent } from './media';
import { ParsedNode } from './parsed.node';

export interface RequestBody extends ParsedNode {
  description?: string;
  required?: boolean;
  extensions?: Record<string, string>;
  content?: MediaContent[];
}
