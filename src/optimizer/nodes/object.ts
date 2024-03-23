import { OptimizedNode } from './optimized.node';

export interface ObjectNode extends OptimizedNode {
  properties: Property[];
}

export interface Property extends OptimizedNode {
  name: string;
  required: boolean;
  definition: OptimizedNode;
}

export const isObjectNode = (value: OptimizedNode): value is ObjectNode => {
  return value.type === 'object';
};

export const isProperty = (value: OptimizedNode): value is Property => {
  return value.type === 'property';
};
