import { OptimizedNode } from './optimized.node.js';

export interface Exclusion extends OptimizedNode {
  definition: OptimizedNode;
}

export const isExclusion = (value: OptimizedNode): value is Exclusion => {
  return value.type === 'exclusion';
};
