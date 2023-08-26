import { MediaEncoding } from './encoding';
import { ParsedNode } from './parsed.node';

export interface MediaType extends ParsedNode {
  definition?: ParsedNode;
  encodings?: MediaEncoding[];
}

export interface MediaContent extends ParsedNode {
  name: string;
  definition: MediaType;
}
