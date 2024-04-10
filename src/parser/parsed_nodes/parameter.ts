import { MediaContent } from './media';
import { compareModifiers } from './modifiers';
import { ParsedNode, CompareParsedNodes } from './parsed.node';

export interface Parameter extends ParsedNode {
  name: string;
  in: string;
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  definition?: ParsedNode;
  content?: MediaContent[];
}

export const isParameter = (value: ParsedNode): value is Parameter => {
  return value.type === 'parameter';
};

export const compareParameters = (a: Parameter, b: Parameter, comparer: CompareParsedNodes): boolean => {
  const same =
    a.name === b.name &&
    a.in === b.in &&
    a.description === b.description &&
    a.required === b.required &&
    a.deprecated === b.deprecated &&
    a.allowEmptyValue === b.allowEmptyValue &&
    a.style === b.style &&
    a.explode === b.explode &&
    a.allowReserved === b.allowReserved &&
    compareModifiers(a, b) &&
    comparer(a.definition, b.definition);

  // TODO check content

  console.log(`${a.name} compare ${b.name} is ${same}`, a, b);

  return same;
};
