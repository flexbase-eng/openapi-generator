import { OasNodeModifiers } from './oas.node.modifiers';
import { OasNodeType } from './oas.node.type';

export class OasNodeTypeResponseContent extends OasNodeType {
  constructor(
    private readonly _mediaType: string,
    private _contentType: OasNodeType,
    private _headers: OasNodeType | undefined,
    modifiers: OasNodeModifiers
  ) {
    super('response_content', modifiers);
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

  get headers(): OasNodeType | undefined {
    return this._headers;
  }

  set headers(value: OasNodeType | undefined) {
    this._headers = value;
  }
}
