import { OpenAPIV3 as OpenAPI } from 'openapi-types';

type UnionToIntersection<U> = (U extends never ? never : (arg: U) => never) extends (arg: infer I) => void ? I : never;

type UnionToTuple<T> = UnionToIntersection<T extends never ? never : (t: T) => T> extends (_: never) => infer W
  ? [...UnionToTuple<Exclude<T, W>>, W]
  : [];

const nonArraySchemaObjectTypeArray: UnionToTuple<Exclude<OpenAPI.NonArraySchemaObjectType, 'object'>> = ['string', 'number', 'boolean', 'integer'];

const nonArraySchemaObjectType: string[] = nonArraySchemaObjectTypeArray;

export interface Node {
  node: string;
}

export class OpenApiParser {
  parse(document: OpenAPI.Document) {
    const components = document.components ? this.parseComponents(document.components) : [];

    return components;
  }

  parseComponents(components: OpenAPI.ComponentsObject) {
    const nodes: Node[] = [];

    if (components.schemas) {
      const records = Object.entries(components.schemas);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const refName = `#/components/schemas/${name}`;

        const nodeType = this.parseSchema(schema);
        nodes.push(nodeType);

        // const modifiers = nodeType.modifiers;
        // nodeType.modifiers = {};
        // const declaration = new OasNodeDeclaration(name, 'model', nodeType, modifiers, refName);
        // declarations.push(declaration);
        // modelMappings.set(refName, declaration);
      }
    }

    return nodes;
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

  parseSchema(schema: OpenAPI.SchemaObject | OpenAPI.ReferenceObject): Node {
    if (this.isReferenceObject(schema)) {
      return this.createReference(schema);
    }

    if (this.isArraySchemaObject(schema)) {
      return {
        node: 'ArrayExpression',
      };
    } else if (this.isNonArraySchemaObject(schema)) {
      if (schema.allOf) {
      }

      if (schema.anyOf) {
      }

      if (schema.oneOf) {
      }

      if (schema.not) {
      }

      if (schema.type === 'object') {
        return this.createObject(schema);
      }

      if (schema.type && nonArraySchemaObjectType.includes(schema.type)) {
        return this.createLiteral(schema);
      }
    }
    return { node: 'void' };
  }

  createReference(schema: OpenAPI.ReferenceObject) {
    return <Node>{
      node: 'ReferenceExpression',
      reference: schema.$ref,
    };
  }

  createLiteral(schema: OpenAPI.NonArraySchemaObject) {
    return {
      node: 'LiteralExpression',
      value: schema.type!,
    };
  }

  createProperty(name: string, schema: OpenAPI.SchemaObject | OpenAPI.ReferenceObject) {

    return {
      node: 'PropertyExpression',
      identifier: {
        node: 'IdentifierExpression',
        value: name
      },
      type: 
    }

    const propertyType = this.parseSchema(schema);
    properties.push({
      identifier,
      propertyType,
    });
  }

  createObject(schema: OpenAPI.NonArraySchemaObject) {
    const properties = [];
    if (schema.properties) {
      const propEntries = Object.entries(schema.properties);
      for (const propEntry of propEntries) {
        properties.push(this.createProperty(propEntry[0], propEntry[1]));
        
      }
    }

    return {
      node: 'ObjectExpression',
      properties,
    };
  }
}
