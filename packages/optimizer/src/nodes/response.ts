import { HeaderObject } from './header.js';
import { OptimizedNode } from './optimized.node.js';
import { Reference } from './reference.js';

export interface ResponseContent extends OptimizedNode {
  contentType: string;
  definition: OptimizedNode;
}

export interface ResponseObject extends OptimizedNode {
  status: number;
  description: string;
  headers?: HeaderObject;
  'content-type'?: Record<string, OptimizedNode>;
}

export interface Response extends OptimizedNode {
  name: string;
  responses: (ResponseObject | Reference)[];
}

export const isResponseContent = (value: OptimizedNode): value is ResponseContent => {
  return value.type === 'responseContent';
};

export const isResponseObject = (value: OptimizedNode): value is ResponseObject => {
  return value.type === 'responseObject';
};

export const isResponse = (value: OptimizedNode): value is Response => {
  return value.type === 'response';
};
