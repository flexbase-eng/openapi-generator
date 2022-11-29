import { OasNodeModifiers } from './oas.node.modifiers';
import { OasNodeType } from './oas.node.type';

export class OasNodeTypeArray extends OasNodeType {
  constructor(private readonly _arrayType: OasNodeType, modifiers: OasNodeModifiers) {
    super('array', modifiers);
  }

  get arrayType(): OasNodeType {
    return this._arrayType;
  }
}
