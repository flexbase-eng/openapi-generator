import { OpenApiSpecTree } from 'src/oas-tree/oas.tree';

export interface IAstBuilder {
  makeDocument(oas: OpenApiSpecTree): Node;
}
