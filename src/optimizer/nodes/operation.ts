import { OptimizedNode } from './optimized.node.js';
import { Reference } from './reference.js';

export interface Operation extends OptimizedNode {
  method: string;
  tags?: string[];
  description?: string;
  summary?: string;
  operationId?: string;
  deprecated?: boolean;
  pathParameter?: Reference;
  headerParameter?: Reference;
  queryParameter?: Reference;
  cookieParameter?: Reference;
  request?: Reference;
  response?: Reference;
  callbacks?: Reference;
  security?: Record<string, string[]>[];
  extensions?: Record<string, string>;
  pathRegex?: Record<string, string>;
}

export const isOperation = (value: OptimizedNode): value is Operation => {
  return value.type === 'operation';
};
