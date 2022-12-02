import { Node } from './ast.node';

export interface ReferenceExpression extends Node {
  node: 'ReferenceExpression';
  key: string;
}

export const IsReferenceExpression = (obj: any): obj is ReferenceExpression => {
  return Object.hasOwn(obj, 'node') && obj.node === 'ReferenceExpression';
};
