import { MediaContent } from './media.js';
import { ParsedNode } from './parsed.node.js';

export interface RequestBody extends ParsedNode {
  description?: string;
  required?: boolean;
  extensions?: Record<string, string>;
  content?: MediaContent[];
}

export const isRequestBody = (value: ParsedNode): value is RequestBody => {
  return value.type === 'requestBody';
};
