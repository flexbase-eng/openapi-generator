import { ParsedNode } from './parsed.node.js';

export interface SecurityScheme extends ParsedNode {
  description?: string;
}

export interface HttpSecurityScheme extends SecurityScheme {
  bearerFormat?: string;
  scheme: string;
}

export interface ApiKeySecurityScheme extends SecurityScheme {
  name: string;
  in: string;
}

export interface OpenIdConnectSecurityScheme extends SecurityScheme {
  openIdConnectUrl: string;
}

export interface OAuth2SecurityScheme extends SecurityScheme {
  flows: {
    implicit?: {
      authorizationUrl: string;
      refreshUrl?: string;
      scopes: Record<string, string>;
    };
    password?: {
      tokenUrl: string;
      refreshUrl?: string;
      scopes: Record<string, string>;
    };
    clientCredentials?: {
      tokenUrl: string;
      refreshUrl?: string;
      scopes: Record<string, string>;
    };
    authorizationCode?: {
      authorizationUrl: string;
      tokenUrl: string;
      refreshUrl?: string;
      scopes: Record<string, string>;
    };
  };
}
