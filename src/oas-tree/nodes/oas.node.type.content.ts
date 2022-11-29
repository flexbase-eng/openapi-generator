import { OasNodeModifiers } from './oas.node.modifiers';
import { OasNodeType } from './oas.node.type';

export class OasNodeTypeContent extends OasNodeType {
  constructor(private readonly _mediaType: string, private _contentType: OasNodeType, modifiers: OasNodeModifiers) {
    super('content', modifiers);
  }

  get mediaType(): string {
    return this._mediaType;
  }

  get contentType(): OasNodeType {
    return this._contentType;
  }

  /** @internal */
  set contentType(value: OasNodeType) {
    this._contentType = value;
  }
}
