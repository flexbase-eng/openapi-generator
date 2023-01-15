import { Declaration } from './ast.declaration';
import { RequestExpression } from './ast.request';
import { OperationResponseExpression } from './ast.response';
import { Node } from './ast.node';
import { SecurityExpression } from './ast.security';

export interface OperationDeclaration extends Declaration {
  node: 'OperationDeclaration';
  httpMethod: string;
  path: string;
  responses?: OperationResponseExpression[];
  requests?: RequestExpression;
  security?: SecurityExpression[];
}

export function IsOperationDeclaration(node: Node): node is OperationDeclaration {
  return node.node === 'OperationDeclaration';
}
