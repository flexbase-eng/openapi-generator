import { Components } from './nodes/components';
import { Path } from './nodes/path';
import { Tag } from './nodes/tag';

export interface OptimizedDocument {
  title: string;
  apiName: string;
  description?: string;
  version: string;
  components: Components;
  paths: Path[];
  tags: Tag[];
}
