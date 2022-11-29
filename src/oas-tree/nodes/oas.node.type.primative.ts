import { OasNodeModifiers } from './oas.node.modifiers';
import { OasNodeType } from './oas.node.type';

export class OasNodeTypePrimative extends OasNodeType {
  constructor(private readonly _primativeType: string, modifiers: OasNodeModifiers) {
    super('primative', modifiers);
  }

  get primativeType(): string {
    return this._primativeType;
  }
}
