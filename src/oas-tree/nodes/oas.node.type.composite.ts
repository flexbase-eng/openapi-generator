import { OasNodeModifiers } from './oas.node.modifiers';
import { OasNodeType } from './oas.node.type';

export class OasNodeTypeComposite extends OasNodeType {
  constructor(private readonly _compositeTypes: OasNodeType[], modifiers: OasNodeModifiers) {
    super('composite', modifiers);
  }

  get compositeTypes(): Readonly<OasNodeType[]> {
    return this._compositeTypes;
  }
}
