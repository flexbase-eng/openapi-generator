import { AstNode } from './ast.node';
import { AstNodeModifiers } from './ast.node.modifiers';

export class AstNodeLiteral extends AstNode {
  constructor(private readonly _value: string, modifiers: AstNodeModifiers) {
    super('literal', modifiers);
  }

  get value(): string {
    return this._value;
  }
}
