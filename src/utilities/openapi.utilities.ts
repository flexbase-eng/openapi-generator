import { OpenAPI, OpenAPIV3 } from 'openapi-types';

export function IsDocument(test: OpenAPI.Document): test is OpenAPIV3.Document {
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
