import { DeclarationNode } from './ast.declaration';
import { Expression } from './ast.expression';

export interface ResponseDeclaration extends DeclarationNode {
  node: 'ResponseDeclaration';
  headers?: Expression;
  responses?: Expression[];
}
