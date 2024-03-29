import { OptimizedNode } from './optimized.node';

export interface Parameter extends OptimizedNode {
  name: string;
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  definition?: OptimizedNode;
}

export interface ParameterObject extends OptimizedNode {
  properties: Parameter[];
}

export const isParameter = (value: OptimizedNode): value is Parameter => {
  return value.type === 'parameter';
};

export const isParameterObject = (value: OptimizedNode): value is ParameterObject => {
  return value.type === 'parameterObject';
};
