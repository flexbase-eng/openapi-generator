import { OasNodeModifiers } from './oas.node.modifiers';
import { OasNodeType } from './oas.node.type';

export class OasNodeTypeRequest extends OasNodeType {
  constructor(
    private _body: OasNodeType | undefined,
    private _pathParameters: OasNodeType | undefined,
    private _cookieParameters: OasNodeType | undefined,
    private _headerParameters: OasNodeType | undefined,
    private _queryParameters: OasNodeType | undefined,
    modifiers: OasNodeModifiers
  ) {
    super('request', modifiers);
  }

  get body(): OasNodeType | undefined {
    return this._body;
  }

  /** @internal */
  set body(value: OasNodeType | undefined) {
    this._body = value;
  }

  get pathParameters(): OasNodeType | undefined {
    return this._pathParameters;
  }

  /** @internal */
  set pathParameters(value: OasNodeType | undefined) {
    this._pathParameters = value;
  }

  get cookieParameters(): OasNodeType | undefined {
    return this._cookieParameters;
  }

  /** @internal */
  set cookieParameters(value: OasNodeType | undefined) {
    this._cookieParameters = value;
  }

  get headerParameters(): OasNodeType | undefined {
    return this._headerParameters;
  }

  /** @internal */
  set headerParameters(value: OasNodeType | undefined) {
    this._headerParameters = value;
  }

  get queryParameters(): OasNodeType | undefined {
    return this._queryParameters;
  }

  /** @internal */
  set queryParameters(value: OasNodeType | undefined) {
    this._queryParameters = value;
  }
}
