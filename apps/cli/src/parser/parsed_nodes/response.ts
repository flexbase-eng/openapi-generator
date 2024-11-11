import { NamedHeader } from './header.js';
import { NamedLink } from './link.js';
import { MediaContent } from './media.js';
import { ParsedNode } from './parsed.node.js';
import { Reference } from './reference.js';

export interface ResponseBody extends ParsedNode {
  description: string;
  headers?: NamedHeader[];
  content?: MediaContent[];
  links?: NamedLink[];
}

export interface Response extends ParsedNode {
  status: string;
  definition: ResponseBody | Reference;
}

export const isResponseBody = (value: ParsedNode): value is ResponseBody => {
  return value.type === 'responseObject';
};

export const isResponse = (value: ParsedNode): value is Response => {
  return value.type === 'response';
};
