import { Declaration } from './ast.declaration';
import { OperationDeclaration } from './ast.operation';
import { Node } from './ast.node';
import { TagNode } from './ast.tag';

export interface AstDocument extends Node {
  node: 'Document';
  title: string;
  description?: string;
  version?: string;
  models: Array<Declaration>;
  responses: Array<Declaration>;
  requests: Array<Declaration>;
  pathParameters: Array<Declaration>;
  headerParameters: Array<Declaration>;
  queryParameters: Array<Declaration>;
  cookieParameters: Array<Declaration>;
  referenceParameters: Array<Declaration>;
  unknownParameters: Array<Declaration>;
  operations: Array<OperationDeclaration>;
  tags: Array<TagNode>;
}
