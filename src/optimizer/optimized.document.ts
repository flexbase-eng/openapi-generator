import { Components } from './nodes/components.js';
import { Path } from './nodes/path.js';
import { Tag } from './nodes/tag.js';

export interface OptimizedDocument {
  title: string;
  apiName: string;
  description?: string;
  version: string;
  components: Components;
  paths: Path[];
  tags: Tag[];
}
