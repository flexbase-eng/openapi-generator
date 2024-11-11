import { Callback } from './callback.js';
import { Parameter } from './parameter.js';
import { ParsedNode } from './parsed.node.js';
import { Reference } from './reference.js';
import { RequestBody } from './request.body.js';
import { Response } from './response.js';

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
