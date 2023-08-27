import { NamedHeader } from './header';
import { NamedLink } from './link';
import { MediaContent } from './media';
import { ParsedNode } from './parsed.node';
import { Reference } from './reference';

export interface ResponseBody extends ParsedNode {
  description: string;
  headers?: NamedHeader[];
  content?: MediaContent[];
  links?: NamedLink[];
}

export interface Response extends ParsedNode {
  status: string;
  definition: ResponseBody | Reference;
}
