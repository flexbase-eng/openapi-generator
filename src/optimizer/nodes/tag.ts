import { OptimizedNode } from './optimized.node';

export interface Tag extends OptimizedNode {
  name: string;
  description?: string;
}
