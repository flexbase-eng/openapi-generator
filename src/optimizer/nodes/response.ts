import { HeaderObject } from './header';
import { OptimizedNode } from './optimized.node';
import { Reference } from './reference';

export interface ResponseContent extends OptimizedNode {
  contentType: string;
  definition: OptimizedNode;
}

export interface ResponseObject extends OptimizedNode {
  description: string;
  //headers?: Record<string, OptimizedNode>;
  headers?: HeaderObject;
  'content-type': Record<string, OptimizedNode>;
  //links?: NamedLink[];
}

export interface Response extends OptimizedNode, Record<number, ResponseObject | Reference> {
  name: string;
  //status: Record<number, ResponseObject | Reference>;
  //definition: ResponseObject | Reference;
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
