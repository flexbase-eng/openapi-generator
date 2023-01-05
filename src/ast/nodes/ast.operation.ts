import { Declaration } from './ast.declaration';
import { RequestExpression } from './ast.request';
import { OperationResponseExpression } from './ast.response';
import { Node } from './ast.node';

export interface OperationDeclaration extends Declaration {
  node: 'OperationDeclaration';
  httpMethod: string;
  path: string;
  responses?: OperationResponseExpression[];
  requests?: RequestExpression;
}

export function IsOperationDeclaration(node: Node): node is OperationDeclaration {
  return node.node === 'OperationDeclaration';
}
