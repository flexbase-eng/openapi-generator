import { Declaration } from './ast.declaration';
import { RequestExpression } from './ast.request';
import { ResponseExpression } from './ast.response';
import { Node } from './ast.node';

export interface OperationDeclaration extends Declaration {
  node: 'OperationDeclaration';
  httpMethod: string;
  path: string;
  responses?: ResponseExpression[];
  requests?: RequestExpression;
}

export function IsOperationDeclaration(node: Node): node is OperationDeclaration {
  return node.node === 'OperationDeclaration';
}
