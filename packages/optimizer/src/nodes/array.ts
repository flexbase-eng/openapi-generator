import { OptimizedNode } from './optimized.node.js';

export interface ArrayNode extends OptimizedNode {
  definition: OptimizedNode;
}

export const isArrayNode = (value: OptimizedNode): value is ArrayNode => {
  return value.type === 'array';
};
