import { OasNodeModifiers } from './oas.node.modifiers';
import { OasNodeLiteral } from './oas.node.literal';
import { OasNodeType } from './oas.node.type';

export class OasNodeTypeReference extends OasNodeType {
  private readonly _identifier: OasNodeLiteral;

  constructor(identifier: OasNodeLiteral | string, modifiers: OasNodeModifiers) {
    super('reference', modifiers);
    if (typeof identifier === 'string') {
      this._identifier = new OasNodeLiteral(identifier, {});
    } else {
      this._identifier = identifier;
    }
  }

  get identifier(): OasNodeLiteral {
    return this._identifier;
  }
}
