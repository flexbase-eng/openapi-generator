import { ParsedNode } from './parsed.node';

export interface ArrayNode extends ParsedNode {
  definition: ParsedNode;
}

export interface ArrayItemNode extends ParsedNode {
  definition: ParsedNode;
}

export const isArrayNode = (value: ParsedNode): value is ArrayNode => {
  return value.type === 'array';
};
