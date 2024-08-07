import { ParsedNode } from './parsed.node.js';

export interface ObjectNode extends ParsedNode {
  properties: Property[];
  additionalProperty?: ParsedNode;
}

export interface Property extends ParsedNode {
  name: string;
  required: boolean;
  definition: ParsedNode;
}

export const isObjectNode = (value: ParsedNode): value is ObjectNode => {
  return value.type === 'object';
};

export const isProperty = (value: ParsedNode): value is Property => {
  return value.type === 'property';
};
