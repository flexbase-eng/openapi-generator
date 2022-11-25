import { AstNodeModifiers } from './ast.node.modifiers';
import { AstNodeType } from './ast.node.type';

export class AstNodeTypeUnion extends AstNodeType {
  constructor(private readonly _unionTypes: AstNodeType[], modifiers: AstNodeModifiers) {
    super('union', modifiers);
  }

  get unionTypes(): Readonly<AstNodeType[]> {
    return this._unionTypes;
  }
}
