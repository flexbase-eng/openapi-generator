import { AstNodeModifiers } from './ast.node.modifiers';
import { AstNodeType } from './ast.node.type';

export class AstNodeTypeArray extends AstNodeType {
  constructor(private readonly _arrayType: AstNodeType, modifiers: AstNodeModifiers) {
    super(modifiers);
  }

  get arrayType(): AstNodeType {
    return this._arrayType;
  }
}
