import { OpenAPIV3_1, OpenAPIV3 } from 'openapi-types';
import { compareStringRecords } from '../../utilities/records';

export type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;
export type ReferenceObject = OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject;
export type DiscriminatorObject = OpenAPIV3.DiscriminatorObject | OpenAPIV3_1.DiscriminatorObject;

export interface Modifiers {
  name?: string;
  description?: string;
  format?: string;
  default?: any;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: boolean | number;
  minimum?: number;
  exclusiveMinimum?: boolean | number;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  additionalProperties?: boolean | ReferenceObject | SchemaObject;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;
  required?: string[] | boolean;
  enum?: any[];
  nullable?: boolean;
  discriminator?: DiscriminatorObject;
  readOnly?: boolean;
  writeOnly?: boolean;
  example?: any;
  deprecated?: boolean;
  extensions?: Record<string, string>;
}

function isReferenceObject(test: object): test is ReferenceObject {
  return '$ref' in test;
}

export const compareModifiers = (a: Modifiers, b: Modifiers): boolean => {
  let same =
    a.name === b.name &&
    a.description === b.description &&
    a.format === b.format &&
    a.default === b.default &&
    a.multipleOf === b.multipleOf &&
    a.maximum === b.maximum &&
    a.exclusiveMaximum === b.exclusiveMaximum &&
    a.minimum === b.minimum &&
    a.exclusiveMinimum === b.exclusiveMinimum &&
    a.maxLength === b.maxLength &&
    a.minLength === b.minLength &&
    a.pattern === b.pattern &&
    //a.additionalProperties === b.additionalProperties &&
    a.maxItems === b.maxItems &&
    a.minItems === b.minItems &&
    a.uniqueItems === b.uniqueItems &&
    a.maxProperties === b.maxProperties &&
    a.minProperties === b.minProperties &&
    //a.required === b.required &&
    //a.enum === b.enum &&
    a.nullable === b.nullable &&
    //a.discriminator === b.discriminator &&
    a.readOnly === b.readOnly &&
    a.writeOnly === b.writeOnly &&
    a.example === b.example &&
    a.deprecated === b.deprecated;
  //a.extensions === b.extensions

  if (typeof a.additionalProperties === 'boolean' && typeof b.additionalProperties === 'boolean') {
    same &&= a.additionalProperties === b.additionalProperties;
  } else if (isReferenceObject(a) && isReferenceObject(b)) {
    same &&= a.$ref === b.$ref;
  } else {
    same &&= a.additionalProperties === b.additionalProperties;
  }

  if (typeof a.required === 'boolean' && typeof b.required === 'boolean') {
    same &&= a.required === b.required;
  } else if (Array.isArray(a.required) && Array.isArray(b.required) && a.required.length === b.required.length) {
    const ar = a.required.sort((a1, b1) => a1.localeCompare(b1));
    const br = b.required.sort((a1, b1) => a1.localeCompare(b1));
    for (let i = 0; i < ar.length; ++i) {
      same &&= ar[i] == br[i];
    }
  } else {
    same &&= a.required === b.required;
  }

  if (Array.isArray(a.enum) && Array.isArray(b.enum)) {
    const ar = a.enum.sort((a1, b1) => a1.localeCompare(b1));
    const br = b.enum.sort((a1, b1) => a1.localeCompare(b1));
    for (let i = 0; i < ar.length; ++i) {
      same &&= ar[i] == br[i];
    }
  } else {
    same &&= a.enum === b.enum;
  }

  if (a.discriminator && b.discriminator) {
    same &&= a.discriminator.propertyName === b.discriminator.propertyName;
    if (a.discriminator.mapping && b.discriminator.mapping) {
      same &&= compareStringRecords(a.discriminator.mapping, b.discriminator.mapping);
    } else {
      same &&= a.discriminator.mapping === b.discriminator.mapping;
    }
  } else {
    same &&= a.discriminator === b.discriminator;
  }

  if (a.extensions && b.extensions) {
    same &&= compareStringRecords(a.extensions, b.extensions);
  } else {
    same &&= a.extensions === b.extensions;
  }

  return same;
};
