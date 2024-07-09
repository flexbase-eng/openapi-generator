import { Components, Path } from './parsed_nodes/index.js';
import { Tag } from './parsed_nodes/tag.js';

export interface ParsedDocument {
  title: string;
  apiName: string;
  description?: string;
  version: string;
  components: Components;
  paths: Path[];
  tags: Tag[];
}
