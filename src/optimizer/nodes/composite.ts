import { OptimizedNode } from './optimized.node';

export interface Composite extends OptimizedNode {
  definitions: OptimizedNode[];
}

export const isComposite = (value: OptimizedNode): value is Composite => {
  return value.type === 'composite';
};
