import { OasNodeModifiers } from './oas.node.modifiers';
import { OasNodeTypeSecurity } from './oas.node.type.security';

export class OasNodeTypeSecurityOpenIdConnect extends OasNodeTypeSecurity {
  constructor(private readonly _openIdConnectUrl: string, modifiers: OasNodeModifiers) {
    super('openIdConnect', modifiers);
  }

  get openIdConnectUrl(): string {
    return this._openIdConnectUrl;
  }
}
