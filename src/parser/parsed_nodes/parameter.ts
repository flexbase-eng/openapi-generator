import { MediaContent } from './media';
import { ParsedNode } from './parsed.node';

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
