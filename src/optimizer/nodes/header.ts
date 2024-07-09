import { BaseObjectNode, BaseProperty } from './base.object.node.js';
import { OptimizedNode } from './optimized.node.js';

export interface Header extends BaseProperty {
  required?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

export interface HeaderObject extends BaseObjectNode<Header> {}

export const isHeader = (value: OptimizedNode): value is Header => {
  return value.type === 'header';
};

export const isHeaderObject = (value: OptimizedNode): value is HeaderObject => {
  return value.type === 'headerObject';
};
