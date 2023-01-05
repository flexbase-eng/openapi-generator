import { Expression } from './ast.expression';
import { Node } from './ast.node';

export interface MediaNode extends Node {
  mediaType: string;
  body: Expression;
}

export interface MediaExpression extends MediaNode {
  node: 'MediaExpression';
}

export interface MediaResponseExpression extends MediaNode {
  node: 'MediaResponseExpression';
  headers?: Expression;
}

export function IsMediaExpression(node: Node): node is MediaExpression {
  return node.node === 'MediaExpression';
}

export function IsMediaResponseExpression(node: Node): node is MediaResponseExpression {
  return node.node === 'MediaResponseExpression';
}
