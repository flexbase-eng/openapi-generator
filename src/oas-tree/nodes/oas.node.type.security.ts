import { OasNodeModifiers } from './oas.node.modifiers';
import { OasNodeType } from './oas.node.type';

export type SecurityType = 'http' | 'apiKey' | 'oauth2' | 'openIdConnect';

export abstract class OasNodeTypeSecurity extends OasNodeType {
  constructor(private readonly _type: SecurityType, modifiers: OasNodeModifiers) {
    super('security', modifiers);
  }

  get type(): SecurityType {
    return this._type;
  }
}
