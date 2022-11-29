import { OasNodeModifiers } from './oas.node.modifiers';
import { OasNodeType } from './oas.node.type';

export class OasNodeTypeUnion extends OasNodeType {
  constructor(private readonly _unionTypes: OasNodeType[], modifiers: OasNodeModifiers) {
    super('union', modifiers);
  }

  get unionTypes(): Readonly<OasNodeType[]> {
    return this._unionTypes;
  }
}
