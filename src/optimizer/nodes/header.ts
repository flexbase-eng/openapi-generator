import { OptimizedNode } from './optimized.node';

export interface Header extends OptimizedNode {
  title: string;
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  definition: OptimizedNode;
}

export interface HeaderObject extends OptimizedNode {
  properties: Header[];
}

export const isHeader = (value: OptimizedNode): value is Header => {
  return value.type === 'header';
};

export const isHeaderObject = (value: OptimizedNode): value is Header => {
  return value.type === 'headerObject';
};
