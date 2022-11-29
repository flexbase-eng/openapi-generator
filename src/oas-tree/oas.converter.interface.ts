import { OpenApiSpecTree } from './oas.tree';
import { OasNode } from './nodes/oas.node';
import { OasNodeDeclaration } from './nodes/oas.node.declaration';
import { OasNodeLiteral } from './nodes/oas.node.literal';
import { OasNodeOperation } from './nodes/oas.node.operation';
import { OasNodeType } from './nodes/oas.node.type';

export interface IOpenApiSpecConverter {
  convertOasToPoco(oas: OpenApiSpecTree): any;
  convertNode(node: OasNode): any;
  convertDeclaration(node: OasNodeDeclaration): any;
  convertLiteral(node: OasNodeLiteral): any;
  convertOperation(node: OasNodeOperation): any;
  convertType(node: OasNodeType): any;
}
