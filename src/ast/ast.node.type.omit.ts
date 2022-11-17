import { AstNodeModifiers } from './ast.node.modifiers';
import { AstNodeType } from './ast.node.type';

export class AstNodeTypeOmit extends AstNodeType {
  constructor(private readonly _originalType: AstNodeType, private readonly _omitFields: string[], modifiers: AstNodeModifiers) {
    super(modifiers);
  }

  get originalType(): AstNodeType {
    return this._originalType;
  }

  get omitFields(): string[] {
    return this._omitFields;
  }
}
