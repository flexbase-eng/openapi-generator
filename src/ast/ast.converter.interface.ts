import { AbstractSyntaxTree } from './ast';
import { AstNode } from './nodes/ast.node';
import { AstNodeDeclaration } from './nodes/ast.node.declaration';
import { AstNodeLiteral } from './nodes/ast.node.literal';
import { AstNodeOperation } from './nodes/ast.node.operation';
import { AstNodeType } from './nodes/ast.node.type';

export interface IAbstractSyntaxTreeConverter {
  convertAstToPoco(ast: AbstractSyntaxTree): any;
  convertNode(node: AstNode): any;
  convertDeclaration(node: AstNodeDeclaration): any;
  convertLiteral(node: AstNodeLiteral): any;
  convertOperation(node: AstNodeOperation): any;
  convertType(node: AstNodeType): any;
}
