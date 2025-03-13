import { Operation } from './operation.js';
import { ParsedNode } from './parsed.node.js';
import { Reference } from './reference.js';

export interface Path extends ParsedNode {
  name: string;
  definition?: PathItem | Reference;
}

export interface PathItem extends ParsedNode {
  operations: Operation[];
  // parameters?: (Parameter | Reference)[];
}

export const isPath = (value: ParsedNode): value is Path => {
  return value.type === 'pathItem';
};

export const isPathItem = (value: ParsedNode): value is PathItem => {
  return value.type === 'pathItemObject';
};
