import { Components, Path } from './parsed_nodes';
import { Tag } from './parsed_nodes/tag';

export interface ParsedDocument {
  title: string;
  description?: string;
  version: string;
  components: Components;
  paths: Path[];
  tags: Tag[];
}
