import { OasNode } from './oas.node';
import { OasNodeModifiers } from './oas.node.modifiers';

export class OasNodeLiteral extends OasNode {
  constructor(private readonly _value: string, modifiers: OasNodeModifiers) {
    super('literal', modifiers);
  }

  get value(): string {
    return this._value;
  }
}
