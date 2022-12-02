import { Expression } from './ast.expression';
import { IdentifierExpression } from './ast.identifier';
import { Node } from './ast.node';

export interface Declaration extends Node {
  id: IdentifierExpression;
  definition: Expression;
  title?: string;
  value?: Expression;
  description?: string;
  format?: string;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: boolean;
  minimum?: number;
  exclusiveMinimum?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;
  required?: boolean;
  enum?: any[];
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  deprecated?: boolean;
  extensions?: any;
  examples?: any;
}
