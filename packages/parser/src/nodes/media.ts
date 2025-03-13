import { MediaEncoding } from './encoding.js';
import { ParsedNode } from './parsed.node.js';

export interface MediaType extends ParsedNode {
  definition?: ParsedNode;
  encodings?: MediaEncoding[];
}

export interface MediaContent extends ParsedNode {
  name: string;
  definition: MediaType;
}

export const isMediaContent = (value: ParsedNode): value is MediaContent => {
  return value.type === 'mediaContent';
};

export const isMediaType = (value: ParsedNode): value is MediaType => {
  return value.type === 'mediaTypeObject';
};
