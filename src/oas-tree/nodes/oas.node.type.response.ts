import { OasNodeModifiers } from './oas.node.modifiers';
import { OasNodeType } from './oas.node.type';

export class OasNodeTypeResponse extends OasNodeType {
  constructor(private _content: OasNodeType[] | undefined, modifiers: OasNodeModifiers) {
    super('response', modifiers);
  }

  get content(): OasNodeType[] | undefined {
    return this._content;
  }

  /** @internal */
  set content(value: OasNodeType[] | undefined) {
    this._content = value;
  }
}
