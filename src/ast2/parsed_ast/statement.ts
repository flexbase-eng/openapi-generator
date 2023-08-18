import { Node, NodeModifiers } from './node';

export class Statement implements Node {
  private readonly _statements: Node[];

  constructor(
    statements: Node[],
    private _modifiers: NodeModifiers = {},
  ) {
    if (Array.isArray(statements)) {
      this._statements = statements;
    } else {
      this._statements = [statements];
    }
  }

  get modifiers() {
    return this._modifiers;
  }

  set modifiers(value: NodeModifiers) {
    this._modifiers = value;
  }
}
