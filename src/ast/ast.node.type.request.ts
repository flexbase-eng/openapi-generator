import { AstNodeModifiers } from './ast.node.modifiers';
import { AstNodeType } from './ast.node.type';

export class AstNodeTypeRequest extends AstNodeType {
  constructor(
    private _body: AstNodeType | undefined,
    private _pathParameters: AstNodeType | undefined,
    private _cookieParameters: AstNodeType | undefined,
    private _headerParameters: AstNodeType | undefined,
    private _queryParameters: AstNodeType | undefined,
    modifiers: AstNodeModifiers
  ) {
    super(modifiers);
  }

  get body(): AstNodeType | undefined {
    return this._body;
  }

  /** @internal */
  set body(value: AstNodeType | undefined) {
    this._body = value;
  }

  get pathParameters(): AstNodeType | undefined {
    return this._pathParameters;
  }

  /** @internal */
  set pathParameters(value: AstNodeType | undefined) {
    this._pathParameters = value;
  }

  get cookieParameters(): AstNodeType | undefined {
    return this._cookieParameters;
  }

  /** @internal */
  set cookieParameters(value: AstNodeType | undefined) {
    this._cookieParameters = value;
  }

  get headerParameters(): AstNodeType | undefined {
    return this._headerParameters;
  }

  /** @internal */
  set headerParameters(value: AstNodeType | undefined) {
    this._headerParameters = value;
  }

  get queryParameters(): AstNodeType | undefined {
    return this._queryParameters;
  }

  /** @internal */
  set queryParameters(value: AstNodeType | undefined) {
    this._queryParameters = value;
  }
}
