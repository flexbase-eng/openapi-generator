import { OasNodeModifiers } from './oas.node.modifiers';
import { OasNodeTypeSecurity } from './oas.node.type.security';

export class OasNodeTypeSecurityOAuth2Flow {
  constructor(
    private readonly _authorizationUrl: string | undefined,
    private readonly _tokenUrl: string | undefined,
    private readonly _refreshUrl: string | undefined,
    private readonly _scopes: Record<string, string>
  ) {}

  get authorizationUrl(): string | undefined {
    return this._authorizationUrl;
  }

  get tokenUrl(): string | undefined {
    return this._tokenUrl;
  }

  get refreshUrl(): string | undefined {
    return this._refreshUrl;
  }

  get scopes(): Record<string, string> {
    return this._scopes;
  }
}

export class OasNodeTypeSecurityOAuth2 extends OasNodeTypeSecurity {
  constructor(
    private readonly _implicitFlow: OasNodeTypeSecurityOAuth2Flow | undefined,
    private readonly _passwordFlow: OasNodeTypeSecurityOAuth2Flow | undefined,
    private readonly _clientCredentialsFlow: OasNodeTypeSecurityOAuth2Flow | undefined,
    private readonly _authorizationCodeFlow: OasNodeTypeSecurityOAuth2Flow | undefined,
    modifiers: OasNodeModifiers
  ) {
    super('oauth2', modifiers);
  }

  get implicitFlow(): OasNodeTypeSecurityOAuth2Flow | undefined {
    return this._implicitFlow;
  }

  get passwordFlow(): OasNodeTypeSecurityOAuth2Flow | undefined {
    return this._passwordFlow;
  }

  get clientCredentialsFlow(): OasNodeTypeSecurityOAuth2Flow | undefined {
    return this._clientCredentialsFlow;
  }

  get authorizationCodeFlow(): OasNodeTypeSecurityOAuth2Flow | undefined {
    return this._authorizationCodeFlow;
  }
}
