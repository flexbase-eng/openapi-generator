import { Node, NodeModifiers } from './node';

export abstract class Literal implements Node {
  constructor(private _modifiers: NodeModifiers = {}) {}

  get modifiers() {
    return this._modifiers;
  }

  set modifiers(value: NodeModifiers) {
    this._modifiers = value;
  }
}

export class LiteralBoolean extends Literal {}

export class LiteralObject extends Literal {}

export class LiteralNumber extends Literal {}

export class LiteralString extends Literal {}

export class LiteralInteger extends Literal {}

export class LiteralNull extends Literal {}
