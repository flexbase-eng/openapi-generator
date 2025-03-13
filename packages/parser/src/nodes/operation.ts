import type { Callback } from './callback.js';
import type { Parameter } from './parameter.js';
import type { ParsedNode } from './parsed.node.js';
import type { Reference } from './reference.js';
import type { RequestBody } from './request.body.js';
import type { Response } from './response.js';

export interface Operation extends ParsedNode {
  method: string;
  tags?: string[];
  description?: string;
  summary?: string;
  operationId?: string;
  deprecated?: boolean;
  parameters?: (Parameter | Reference)[];
  requestBody?: RequestBody | Reference;
  responses?: (Response | Reference)[];
  callbacks?: (Callback | Reference)[];
  security?: Record<string, string[]>[];
  extensions?: Record<string, string>;
}

export const isOperation = (value: ParsedNode): value is Operation => {
  return value.type === 'operation';
};
