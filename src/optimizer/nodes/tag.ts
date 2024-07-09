import { OptimizedNode } from './optimized.node.js';

export interface Tag extends OptimizedNode {
  name: string;
  description?: string;
}
