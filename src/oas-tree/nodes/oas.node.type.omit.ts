import { OasNodeModifiers } from './oas.node.modifiers';
import { OasNodeType } from './oas.node.type';

export class OasNodeTypeOmit extends OasNodeType {
  constructor(private readonly _originalType: OasNodeType, private readonly _omitFields: string[], modifiers: OasNodeModifiers) {
    super('omit', modifiers);
  }

  get originalType(): OasNodeType {
    return this._originalType;
  }

  get omitFields(): string[] {
    return this._omitFields;
  }
}
