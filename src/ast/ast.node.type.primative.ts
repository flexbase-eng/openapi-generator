import { AstNodeModifiers } from './ast.node.modifiers';
import { AstNodeType } from './ast.node.type';

export type AstNodeTypePrimativeTypes = 'boolean' | 'integer' | 'number' | 'string' | 'void';

export class AstNodeTypePrimative extends AstNodeType {
  constructor(private readonly _primativeType: AstNodeTypePrimativeTypes, modifiers: AstNodeModifiers) {
    super(modifiers);
  }

  get primativeType(): AstNodeTypePrimativeTypes {
    return this._primativeType;
  }
}
