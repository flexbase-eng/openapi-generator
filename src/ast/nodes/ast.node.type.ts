import { AstNode } from './ast.node';
import { AstNodeModifiers } from './ast.node.modifiers';

export type AstNodeKindType =
  | 'object'
  | 'array'
  | 'composite'
  | 'union'
  | 'omit'
  | 'reference'
  | 'primative'
  | 'response'
  | 'request'
  | 'content'
  | 'body';

export abstract class AstNodeType extends AstNode {
  constructor(private readonly _kindType: AstNodeKindType, modifiers: AstNodeModifiers) {
    super('type', modifiers);
  }

  get kindType(): AstNodeKindType {
    return this._kindType;
  }
}
