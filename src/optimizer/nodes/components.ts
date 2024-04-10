import { OptimizedNode } from './optimized.node';

export interface Components {
  models?: Record<string, OptimizedNode>;
  requests?: Record<string, OptimizedNode>;
  requestObjects?: Record<string, OptimizedNode>;
  responses?: Record<string, OptimizedNode>;
  responseObjects?: Record<string, OptimizedNode>;
  parameters?: Record<string, OptimizedNode>;
  headers?: Record<string, OptimizedNode>;
  securitySchemes?: Record<string, OptimizedNode>;
  callbacks?: Record<string, OptimizedNode>;
  pathItems?: Record<string, OptimizedNode>;
  pathParameters?: Record<string, OptimizedNode>;
  headerParameters?: Record<string, OptimizedNode>;
  queryParameters?: Record<string, OptimizedNode>;
  cookieParameters?: Record<string, OptimizedNode>;
}
