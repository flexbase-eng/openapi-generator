import { MediaContent } from './media.js';
import { ParsedNode } from './parsed.node.js';

export interface Header extends ParsedNode {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  definition?: ParsedNode;
  content?: MediaContent[];
}

export interface NamedHeader extends ParsedNode {
  name: string;
  definition: ParsedNode;
}

export const isHeader = (value: ParsedNode): value is Header => {
  return value.type === 'headerObject';
};

export const isNamedHeader = (value: ParsedNode): value is NamedHeader => {
  return value.type === 'header';
};
