import { BaseProperty, BaseObjectNode } from './base.object.node';
import { OptimizedNode } from './optimized.node';

export interface Property extends BaseProperty {
  required: boolean;
}

export interface ObjectNode extends BaseObjectNode<Property> {
  additionalProperty?: OptimizedNode;
}

export const isProperty = (value: OptimizedNode): value is Property => {
  return value.type === 'property';
};

export const isObjectNode = (value: OptimizedNode): value is ObjectNode => {
  return value.type === 'object';
};
