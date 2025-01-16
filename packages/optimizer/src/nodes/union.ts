import { OptimizedNode } from './optimized.node.js';

export interface Union extends OptimizedNode {
  definitions: OptimizedNode[];
}

export const isUnion = (value: OptimizedNode): value is Union => {
  return value.type === 'union';
};
