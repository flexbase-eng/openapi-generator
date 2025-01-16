import { Operation } from './operation.js';
import { OptimizedNode } from './optimized.node.js';

export interface Path extends OptimizedNode {
  name: string;
  operations: Operation[];
}

export const isPath = (value: OptimizedNode): value is Path => {
  return value.type === 'path';
};
