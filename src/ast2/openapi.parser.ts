import { OpenAPIV3_1, OpenAPIV3 } from 'openapi-types';
import {
  ArrayDeclaration,
  CompositeDeclaration,
  ObjectDeclaration,
  NotDeclaration,
  OneOfDeclaration,
  UnionDeclaration,
  MediaContentDeclaration,
  Declaration,
  EncodingDeclaration,
  HeaderDeclaration,
} from './parsed_ast/declaration';
import { NodeModifiers } from './parsed_ast/node';
import { EncodingExpression, HeaderExpression, PrimativeExpression, ReferenceExpression } from './parsed_ast/expression';

type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;
type ReferenceObject = OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject;
type BaseSchemaObject = OpenAPIV3.BaseSchemaObject | OpenAPIV3_1.BaseSchemaObject;
type ArraySchemaObject = OpenAPIV3.ArraySchemaObject | OpenAPIV3_1.ArraySchemaObject;
type NonArraySchemaObject = OpenAPIV3.NonArraySchemaObject | OpenAPIV3_1.NonArraySchemaObject;
type NonArraySchemaObjectType = OpenAPIV3.NonArraySchemaObjectType | OpenAPIV3_1.NonArraySchemaObjectType;
type RequestBodyObject = OpenAPIV3.RequestBodyObject | OpenAPIV3_1.RequestBodyObject;
type MediaTypeObject = OpenAPIV3.MediaTypeObject | OpenAPIV3_1.MediaTypeObject;
type EncodingObject = OpenAPIV3.EncodingObject | OpenAPIV3_1.EncodingObject;
type HeaderObject = OpenAPIV3.HeaderObject | OpenAPIV3_1.HeaderObject;

type UnionToIntersection<U> = (U extends never ? never : (arg: U) => never) extends (arg: infer I) => void ? I : never;

type UnionToTuple<T> = UnionToIntersection<T extends never ? never : (t: T) => T> extends (_: never) => infer W
  ? [...UnionToTuple<Exclude<T, W>>, W]
  : [];

const nonArraySchemaObjectTypeArray: UnionToTuple<Exclude<NonArraySchemaObjectType, 'object'>> = ['string', 'number', 'boolean', 'integer', 'null'];

const nonArraySchemaObjectType: string[] = nonArraySchemaObjectTypeArray;

export abstract class OpenApiParser {
  private isReferenceObject(test: object): test is ReferenceObject {
    return '$ref' in test;
  }

  private isArraySchemaObject(test: SchemaObject): test is ArraySchemaObject {
    return 'items' in test && test.type === 'array';
  }

  private isNonArraySchemaObject(test: SchemaObject): test is NonArraySchemaObject {
    return !('items' in test);
  }

  private getExtensions(obj: any): Record<string, string> | undefined {
    const extensions: Record<string, string> = {};

    const keys = Object.keys(obj).filter(key => key.startsWith('x-'));

    if (keys.length === 0) {
      return undefined;
    }

    keys.forEach(key => (extensions[key] = obj[key]));

    return extensions;
  }

  private getModifiers(schema: any): NodeModifiers {
    return {
      title: schema.title,
      description: schema.description,
      format: schema.format,
      default: schema.default,
      multipleOf: schema.multipleOf,
      maximum: schema.maximum,
      exclusiveMaximum: schema.exclusiveMaximum,
      minimum: schema.minimum,
      exclusiveMinimum: schema.exclusiveMinimum,
      maxLength: schema.maxLength,
      minLength: schema.minLength,
      pattern: schema.pattern,
      additionalProperties: schema.additionalProperties,
      maxItems: schema.maxItems,
      minItems: schema.minItems,
      uniqueItems: schema.uniqueItems,
      maxProperties: schema.maxProperties,
      minProperties: schema.minProperties,
      required: schema.required,
      enum: schema.enum,
      nullable: schema.nullable,
      discriminator: schema.discriminator,
      readOnly: schema.readOnly,
      writeOnly: schema.writeOnly,
      deprecated: schema.deprecated,
      extensions: this.getExtensions(schema),
      example: schema.example,
    };
  }

  parseComponentSchema(declaration: ObjectDeclaration, schema: SchemaObject | ReferenceObject): ObjectDeclaration {
    declaration.modifiers = this.getModifiers(schema);

    if (this.isReferenceObject(schema)) {
      declaration.addExpression(new ReferenceExpression(schema.$ref));
      return declaration;
    }

    if (this.isArraySchemaObject(schema)) {
      const array = new ArrayDeclaration(declaration);
      array.addExpression(this.parseComponentSchema(new ObjectDeclaration('', declaration.specifier), schema.items));
      return array;
    }

    if (this.isNonArraySchemaObject(schema)) {
      if (schema.allOf) {
        const composite = new CompositeDeclaration(declaration);
        const types = schema.allOf.map(x => this.parseComponentSchema(new ObjectDeclaration('', declaration.specifier), x));
        composite.addExpression(types);
        return composite;
      }

      if (schema.anyOf) {
        const union = new UnionDeclaration(declaration);
        const types = schema.anyOf.map(x => this.parseComponentSchema(new ObjectDeclaration('', declaration.specifier), x));
        union.addExpression(types);
        return union;
      }

      if (schema.oneOf) {
        const oneOf = new OneOfDeclaration(declaration);
        const types = schema.oneOf.map(x => this.parseComponentSchema(new ObjectDeclaration('', declaration.specifier), x));
        oneOf.addExpression(types);
        return oneOf;
      }

      if (schema.not) {
        const not = new NotDeclaration(declaration);
        not.addExpression(this.parseComponentSchema(new ObjectDeclaration('', declaration.specifier), schema.not));
        return not;
      }

      if (schema.type === 'object') {
        if (schema.properties) {
          const propEntries = Object.entries(schema.properties);
          for (const propEntry of propEntries) {
            const isRequired = schema.required?.find(x => x === propEntry[0]) !== undefined;

            const propertyDeclaration = new ObjectDeclaration(propEntry[0], 'property');
            propertyDeclaration.isRequired = isRequired;
            declaration.addExpression(this.parseComponentSchema(propertyDeclaration, propEntry[1]));
          }
        }
        return declaration;
      }

      if (schema.type && nonArraySchemaObjectType.includes(schema.type)) {
        declaration.addExpression(new PrimativeExpression(schema.type));
        return declaration;
      }
    }

    throw new Error(`Unknown schema`);
  }

  parseComponentRequestBody(declaration: ObjectDeclaration, schema: ReferenceObject | RequestBodyObject): ObjectDeclaration {
    declaration.modifiers = this.getModifiers(schema);

    if (this.isReferenceObject(schema)) {
      declaration.addExpression(new ReferenceExpression(schema.$ref));
      return declaration;
    }

    declaration.addExpression(this.parseMediaContent(schema.content));

    return declaration;
  }

  private parseMediaContent(mediaContent?: { [media: string]: MediaTypeObject }) {
    if (!mediaContent) return undefined;

    const content: MediaContentDeclaration[] = [];
    const mediaContentRecords = Object.entries(mediaContent);
    for (const mediaContentRecord of mediaContentRecords) {
      const name = mediaContentRecord[0];
      const mediaTypeObject = mediaContentRecord[1];

      const mce = new MediaContentDeclaration(name);
      content.push(mce);

      if (mediaTypeObject.schema) {
        mce.addExpression(this.parseComponentSchema(new ObjectDeclaration(name, 'model'), mediaTypeObject.schema));
      }

      if (mediaTypeObject.encoding) {
        const encodingRecords = Object.entries(mediaTypeObject.encoding);
        for (const encodingRecord of encodingRecords) {
          const name = encodingRecord[0];
          const encoding = encodingRecord[1];

          const encodingDeclaration = new EncodingDeclaration(name);
          mce.addEncoding(encodingDeclaration);

          const encodingExpression = new EncodingExpression(encoding.contentType, encoding.style, encoding.explode, encoding.allowReserved);
          encodingExpression.addHeader(this.parseHeaders(encoding.headers));

          encodingDeclaration.addExpression(encodingExpression);
        }
      }
    }

    return content;
  }

  private parseHeaders(headers?: { [header: string]: ReferenceObject | HeaderObject }) {
    if (!headers) return undefined;

    const headerDeclarations: HeaderDeclaration[] = [];

    const records = Object.entries(headers);
    for (const record of records) {
      const name = record[0];
      const header = record[1];

      const headerDeclaration = this.parseHeaderObject(new HeaderDeclaration(name), header);

      headerDeclarations.push(headerDeclaration);
    }

    return headerDeclarations;
  }

  private parseHeaderObject(declaration: HeaderDeclaration, header: HeaderObject | ReferenceObject): HeaderDeclaration {
    if (this.isReferenceObject(header)) {
      declaration.addExpression(new ReferenceExpression(header.$ref));
      return declaration;
    }

    const description = header.description;
    const required = header.required;
    const deprecated = header.deprecated;
    const allowEmptyValue = header.allowEmptyValue;
    const style = header.style;
    const explode = header.explode;
    const allowReserved = header.allowReserved;

    declaration.modifiers = {
      description,
      required,
      deprecated,
      allowEmptyValue,
      style,
      explode,
      allowReserved,
    };

    if (header.schema) {
      declaration.addExpression(this.parseComponentSchema(new ObjectDeclaration('', 'model'), header.schema));
    }

    declaration.addContent(this.parseMediaContent(header.content));

    return declaration;
  }
}
