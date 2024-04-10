import { OptimizedNode } from './optimized.node';

export interface BaseObjectNode<T extends BaseProperty = BaseProperty> extends OptimizedNode {
  properties: T[];
}

export interface BaseProperty extends OptimizedNode {
  name: string;
  definition: OptimizedNode;
}
