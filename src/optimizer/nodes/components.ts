import { OptimizedNode } from './optimized.node';

export interface Components {
  models?: Record<string, Component>;
  requests?: Record<string, Component>;
  responses?: Record<string, Component>;
  parameters?: Record<string, OptimizedNode>;
  headers?: Record<string, Component>;
  securitySchemes?: Record<string, Component>;
  callbacks?: Record<string, Component>;
  pathItems?: Record<string, Component>;
  pathParameters?: Record<string, Component>;
  headerParameters?: Record<string, Component>;
  queryParameters?: Record<string, Component>;
  cookieParameters?: Record<string, Component>;
}

export interface Component<T extends OptimizedNode = OptimizedNode> {
  generated?: boolean;
  definition: T;
}
