import { Expression } from './ast.expression';
import { IdentifierExpression } from './ast.identifier';
import { Node } from './ast.node';

export interface OmitNode extends Node {
  elements: Expression;
  omit: Array<IdentifierExpression>;
}

export interface OmitExpression extends OmitNode {
  node: 'OmitExpression';
}
