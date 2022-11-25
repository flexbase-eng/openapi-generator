import { AstNodeDeclaration } from './nodes/ast.node.declaration';
import { AstNodeOperation } from './nodes/ast.node.operation';

export interface AbstractSyntaxTree {
  name: string;
  title: string;
  description?: string;
  version: string;
  declarations: AstNodeDeclaration[];
  operations: AstNodeOperation[];
}
