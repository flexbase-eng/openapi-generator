import { ParsedNode } from './parsed.node';

export interface Reference extends ParsedNode {
  reference: string;
  summary?: string;
  description?: string;
}

export const isReference = (value: ParsedNode): value is Reference => {
  return value.type === 'reference';
};
