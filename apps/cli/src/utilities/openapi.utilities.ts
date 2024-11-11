import { OpenAPI, OpenAPIV3 } from 'openapi-types';

export function IsDocument(test: any): test is OpenAPIV3.Document {
  return 'components' in test;
}

export function IsReferenceObject(test: any): test is OpenAPIV3.ReferenceObject {
  return '$ref' in test;
}

export function IsArraySchemaObject(test: OpenAPIV3.SchemaObject): test is OpenAPIV3.ArraySchemaObject {
  return 'items' in test;
}

export function IsOperation(test: OpenAPI.Operation): test is OpenAPIV3.OperationObject {
  return true;
}

export function IsSecurityHttp(test: OpenAPIV3.SecuritySchemeObject): test is OpenAPIV3.HttpSecurityScheme {
  return test.type === 'http';
}

export function IsSecurityApiKey(test: OpenAPIV3.SecuritySchemeObject): test is OpenAPIV3.ApiKeySecurityScheme {
  return test.type === 'apiKey';
}

export function IsSecurityOAuth2(test: OpenAPIV3.SecuritySchemeObject): test is OpenAPIV3.OAuth2SecurityScheme {
  return test.type === 'oauth2';
}

export function IsSecurityOpenIdConnect(test: OpenAPIV3.SecuritySchemeObject): test is OpenAPIV3.OpenIdSecurityScheme {
  return test.type === 'openIdConnect';
}
