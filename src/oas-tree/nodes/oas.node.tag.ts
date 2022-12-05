import { OasNode } from './oas.node';

export class OasNodeTag extends OasNode {
  constructor(private readonly _name: string, private readonly _description?: string) {
    super('tag', {});
  }

  get name(): string {
    return this._name;
  }

  get description(): string | undefined {
    return this._description;
  }
}
