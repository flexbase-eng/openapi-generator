import { ModelDeclaration } from './ast.model';
import { OperationDeclaration } from './ast.operation';

export interface AstDocument extends Node {
  node: 'Document';
  title?: string;
  description?: string;
  version?: string;
  models: Array<ModelDeclaration>;
  responses: Array<ModelDeclaration>;
  requests: Array<ModelDeclaration>;
  parameters: Array<ModelDeclaration>;
  operations: Array<OperationDeclaration>;
}
