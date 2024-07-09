import { NamedHeader } from './header.js';
import { ParsedNode } from './parsed.node.js';

export interface Encoding extends ParsedNode {
  contentType?: string;
  style?: string;
  explode?: boolean;
  allowReserved?: boolean;
  headers?: NamedHeader[];
}

export interface MediaEncoding extends Encoding {
  name: string;
}
