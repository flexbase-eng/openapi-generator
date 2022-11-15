import { AstNodeModifiers } from './ast.node.modifiers';
import { AstNodeType } from './ast.node.type';

export type AstNodeTypePrimativeTypes = 'boolean' | 'integer' | 'number' | 'string' | 'void';

export class AstNodeTypePrimative extends AstNodeType {
  constructor(private readonly _type: AstNodeTypePrimativeTypes, modifiers: AstNodeModifiers) {
    super(modifiers);
  }

  get type(): AstNodeTypePrimativeTypes {
    return this._type;
  }
}
