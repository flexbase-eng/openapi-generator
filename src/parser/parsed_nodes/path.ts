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
