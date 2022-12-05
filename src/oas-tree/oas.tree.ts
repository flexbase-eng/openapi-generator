import { OasNodeDeclaration } from './nodes/oas.node.declaration';
import { OasNodeOperation } from './nodes/oas.node.operation';
import { OasNodeTag } from './nodes/oas.node.tag';

export interface OpenApiSpecTree {
  title: string;
  description?: string;
  version: string;
  declarations: OasNodeDeclaration[];
  operations: OasNodeOperation[];
  tags?: OasNodeTag[];
}
