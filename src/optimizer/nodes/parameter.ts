import { BaseProperty, BaseObjectNode } from './base.object.node';
import { OptimizedNode } from './optimized.node';

export interface Parameter extends BaseProperty {
  required?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
}

export interface ParameterObject extends BaseObjectNode<Parameter> {}

export const isParameter = (value: OptimizedNode): value is Parameter => {
  return value.type === 'parameter';
};

export const isParameterObject = (value: OptimizedNode): value is ParameterObject => {
  return value.type === 'parameterObject';
};
