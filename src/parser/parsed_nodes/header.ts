import { MediaContent } from './media';
import { ParsedNode } from './parsed.node';

export interface Header extends ParsedNode {
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

export interface NamedHeader extends ParsedNode {
  name: string;
  definition: Header;
}
