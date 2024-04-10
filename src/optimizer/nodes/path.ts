import { Operation } from './operation';
import { OptimizedNode } from './optimized.node';

export interface Path extends OptimizedNode {
  name: string;
  operations: Operation[];
}

export const isPath = (value: OptimizedNode): value is Path => {
  return value.type === 'path';
};
