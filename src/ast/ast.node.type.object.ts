import { AstNodeModifiers } from './ast.node.modifiers';
import { AstNodeDeclaration } from './ast.node.declaration';
import { AstNodeType } from './ast.node.type';

export class AstNodeTypeObject extends AstNodeType {
  constructor(private readonly _fields: AstNodeDeclaration[], modifiers: AstNodeModifiers) {
    super(modifiers);
  }

  get fields(): Readonly<AstNodeDeclaration[]> {
    return this._fields;
  }
}
