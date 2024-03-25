import { OptimizedNode } from './optimized.node';

export interface Request extends OptimizedNode {
  name?: string;
  'content-type': Record<string, OptimizedNode>;
}

export const isRequest = (value: OptimizedNode): value is Request => {
  return value.type === 'request';
};
