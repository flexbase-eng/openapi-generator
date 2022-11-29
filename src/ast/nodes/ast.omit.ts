import { DeclarationNode } from './ast.declaration';
import { Expression } from './ast.expression';
import { Node } from './ast.node';

export interface OmitNode extends Node {
  elements: Expression;
  omit: Array<string>;
}

export interface OmitDeclaration extends OmitNode, DeclarationNode {
  node: 'OmitDeclaration';
}

export interface OmitExpression extends OmitNode {
  node: 'OmitExpression';
}
