import { ParsedNode } from './parsed.node';
import { Reference } from './reference';

export interface Link extends ParsedNode {
  server: unknown;
  operationRef?: string;
  operationId?: string;
  requestBody: unknown;
  description?: string;
  parameters?: Record<string, unknown>;
}

export interface NamedLink extends ParsedNode {
  name: string;
  definition: Link | Reference;
}
