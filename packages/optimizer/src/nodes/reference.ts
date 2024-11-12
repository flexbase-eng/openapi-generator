import { OptimizedNode } from './optimized.node.js';

export interface Reference extends OptimizedNode {
  $ref: string;
  summary?: string;
  description?: string;
}

export const isReference = (value: OptimizedNode): value is Reference => {
  return value.type === 'reference';
};
