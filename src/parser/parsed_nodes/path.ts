import { Operation } from './operation';
import { Parameter } from './parameter';
import { ParsedNode } from './parsed.node';
import { Reference } from './reference';

export interface Path extends ParsedNode {
  name: string;
  definition?: PathItem | Reference;
}

export interface PathItem extends ParsedNode {
  operations: Operation[];
  parameters?: (Parameter | Reference)[];
}

export const isPath = (value: ParsedNode): value is Path => {
  return value.type === 'pathItem';
};

export const isPathItem = (value: ParsedNode): value is PathItem => {
  return value.type === 'pathItemObject';
};
