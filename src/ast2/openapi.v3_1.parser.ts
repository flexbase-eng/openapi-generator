import { OpenAPIV3_1 as OpenAPI } from 'openapi-types';

type UnionToIntersection<U> = (U extends never ? never : (arg: U) => never) extends (arg: infer I) => void ? I : never;

type UnionToTuple<T> = UnionToIntersection<T extends never ? never : (t: T) => T> extends (_: never) => infer W
  ? [...UnionToTuple<Exclude<T, W>>, W]
  : [];

const nonArraySchemaObjectTypeArray: UnionToTuple<Exclude<OpenAPI.NonArraySchemaObjectType, 'object'>> = [
  'string',
  'number',
  'boolean',
  'integer',
  'null',
];

const nonArraySchemaObjectType: string[] = nonArraySchemaObjectTypeArray;

export class OpenApiParser {
  parse(document: OpenAPI.Document) {
    const components = document.components ? this.parseComponents(document.components) : [];

    return components;
  }

  parseComponents(components: OpenAPI.ComponentsObject) {
    if (components.schemas) {
      const records = Object.entries(components.schemas);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const refName = `#/components/schemas/${name}`;

        const nodeType = this.parseSchema(schema);
        // const modifiers = nodeType.modifiers;
        // nodeType.modifiers = {};
        // const declaration = new OasNodeDeclaration(name, 'model', nodeType, modifiers, refName);
        // declarations.push(declaration);
        // modelMappings.set(refName, declaration);
      }
    }
  }

  isReferenceObject(test: object): test is OpenAPI.ReferenceObject {
    return '$ref' in test;
  }

  isArraySchemaObject(test: OpenAPI.SchemaObject): test is OpenAPI.ArraySchemaObject {
    return 'items' in test && test.type === 'array';
  }

  isNonArraySchemaObject(test: OpenAPI.SchemaObject): test is OpenAPI.NonArraySchemaObject {
    return 'type' in test && !('items' in test);
  }

  parseSchema(schema: OpenAPI.SchemaObject) {
    if (this.isReferenceObject(schema)) {
      return {
        node: 'reference',
      };
    }

    if (this.isArraySchemaObject(schema)) {
      return {
        node: 'array',
      };
    }

    if (schema.allOf) {
    }

    if (schema.anyOf) {
    }

    if (schema.oneOf) {
    }

    if (schema.not) {
    }

    if (schema.type === 'object') {
    }

    if (this.isNonArraySchemaObject(schema) && schema.type && nonArraySchemaObjectType.includes(schema.type)) {
      return this.createLiteral(schema);
    }

    return {};
  }

  createLiteral(schema: OpenAPI.NonArraySchemaObject) {
    return {
      node: 'LiteralExpression',
      value: schema.type!,
    };
  }
}
