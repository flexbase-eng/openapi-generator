import { DeclarationNode } from './ast.declaration';
import { Expression } from './ast.expression';

export interface RequestDeclaration extends DeclarationNode {
  node: 'RequestDeclaration';
  requests: Expression[];
}
