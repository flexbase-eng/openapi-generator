import { AstNodeModifiers } from './ast.node.modifiers';

export type AstNodeKind = 'operation' | 'literal' | 'declaration' | 'type';

export abstract class AstNode {
  constructor(private readonly _kind: AstNodeKind, private _modifiers: AstNodeModifiers) {}

  get kind(): AstNodeKind {
    return this._kind;
  }

  get modifiers(): AstNodeModifiers {
    return this._modifiers;
  }

  /** @internal */
  set modifiers(value: AstNodeModifiers) {
    this._modifiers = value;
  }
}
