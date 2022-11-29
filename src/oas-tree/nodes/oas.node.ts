import { OasNodeModifiers } from './oas.node.modifiers';

export type OasNodeKind = 'operation' | 'literal' | 'declaration' | 'type';

export abstract class OasNode {
  constructor(private readonly _kind: OasNodeKind, private _modifiers: OasNodeModifiers) {}

  get kind(): OasNodeKind {
    return this._kind;
  }

  get modifiers(): OasNodeModifiers {
    return this._modifiers;
  }

  /** @internal */
  set modifiers(value: OasNodeModifiers) {
    this._modifiers = value;
  }
}
