import { OasNodeDeclaration } from './nodes/oas.node.declaration';
import { OasNodeOperation } from './nodes/oas.node.operation';

export interface OpenApiSpecTree {
  title: string;
  description?: string;
  version: string;
  declarations: OasNodeDeclaration[];
  operations: OasNodeOperation[];
}
