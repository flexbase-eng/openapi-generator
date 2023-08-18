import { Node } from './node';

export class Primative implements Node {
  constructor(
    private readonly _type: string,
    private readonly _modifiers: object,
  ) {}
}
