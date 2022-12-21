import { OpenApiSpecTree } from 'src/oas-tree/oas.tree';
import { AstDocument } from './nodes/ast.document';

export interface IAstBuilder {
  makeDocument(oas: OpenApiSpecTree): AstDocument;
  organizeByTags(astDocument: AstDocument): AstDocument[];
  removeUnreferencedModels(astDocument: AstDocument): void;
}
