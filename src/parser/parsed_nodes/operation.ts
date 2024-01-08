import { Callback } from './callback';
import { Parameter } from './parameter';
import { ParsedNode } from './parsed.node';
import { Reference } from './reference';
import { RequestBody } from './request.body';
import { Response } from './response';

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
