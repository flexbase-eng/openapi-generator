import { OasNodeModifiers } from './oas.node.modifiers';
import { OasNodeType } from './oas.node.type';

export class OasNodeTypeResponse extends OasNodeType {
  constructor(
    private readonly _statusCode: string,
    private readonly _content: OasNodeType | OasNodeType[] | undefined,
    private _headers: OasNodeType | undefined,
    modifiers: OasNodeModifiers
  ) {
    super('response', modifiers);
  }

  get statusCode(): string {
    return this._statusCode;
  }

  get content(): OasNodeType | OasNodeType[] | undefined {
    return this._content;
  }

  get headers(): OasNodeType | undefined {
    return this._headers;
  }

  set headers(value: OasNodeType | undefined) {
    this._headers = value;
  }
}
