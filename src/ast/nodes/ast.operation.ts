import { Declaration } from './ast.declaration';
import { RequestExpression } from './ast.request';
import { ResponseExpression } from './ast.response';

export interface OperationDeclaration extends Declaration {
  node: 'OperationDeclaration';
  httpMethod: string;
  path: string;
  responses?: ResponseExpression[];
  requests?: RequestExpression;
}
