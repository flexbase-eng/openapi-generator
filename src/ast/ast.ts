import { AstNodeDeclaration } from './ast.node.declaration';
import { AstNodeOperation } from './ast.node.operation';

export interface AbstractSyntaxTree {
  name: string;
  title: string;
  description?: string;
  version: string;
  declarations: AstNodeDeclaration[];
  operations: AstNodeOperation[];
}
