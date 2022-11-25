import { AstNodeModifiers } from './ast.node.modifiers';
import { AstNodeType } from './ast.node.type';

export class AstNodeTypePrimative extends AstNodeType {
  constructor(private readonly _primativeType: string, modifiers: AstNodeModifiers) {
    super('primative', modifiers);
  }

  get primativeType(): string {
    return this._primativeType;
  }
}
