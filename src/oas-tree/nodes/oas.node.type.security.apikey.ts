import { OasNodeModifiers } from './oas.node.modifiers';
import { OasNodeTypeSecurity } from './oas.node.type.security';

export type SecurityLocation = 'query' | 'header' | 'cookie';

export class OasNodeTypeSecurityApiKey extends OasNodeTypeSecurity {
  constructor(private readonly _name: string, private readonly _in: SecurityLocation, modifiers: OasNodeModifiers) {
    super('apiKey', modifiers);
  }

  get name(): string {
    return this._name;
  }

  get in(): SecurityLocation {
    return this._in;
  }
}
