import { OptimizedNode } from './optimized.node.js';

export interface Xor extends OptimizedNode {
  definitions: OptimizedNode[];
  discriminatorPropertyName?: string;
  discriminatorMapping?: Record<string, OptimizedNode>;
}

export const isXor = (value: OptimizedNode): value is Xor => {
  return value.type === 'xor';
};
