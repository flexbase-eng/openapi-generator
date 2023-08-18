import { Node } from './node';

export class Identifier implements Node {
  constructor(private readonly _name: string) {}

  get name() {
    return this._name;
  }
}

export class ReferenceIdentifier extends Identifier {}
