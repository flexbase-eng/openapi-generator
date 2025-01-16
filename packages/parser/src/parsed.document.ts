import { Components, Path } from './nodes/index.js';
import { Tag } from './nodes/tag.js';

export interface ParsedDocument {
  title: string;
  apiName: string;
  description?: string;
  version: string;
  components: Components;
  paths: Path[];
  tags: Tag[];
}
