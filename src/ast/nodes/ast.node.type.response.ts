import { AstNodeModifiers } from './ast.node.modifiers';
import { AstNodeType } from './ast.node.type';

export class AstNodeTypeResponse extends AstNodeType {
  constructor(
    private readonly _statusCode: string,
    private readonly _content: AstNodeType | AstNodeType[] | undefined,
    private _headers: AstNodeType | undefined,
    modifiers: AstNodeModifiers
  ) {
    super('response', modifiers);
  }

  get statusCode(): string {
    return this._statusCode;
  }

  get content(): AstNodeType | AstNodeType[] | undefined {
    return this._content;
  }

  get headers(): AstNodeType | undefined {
    return this._headers;
  }

  set headers(value: AstNodeType | undefined) {
    this._headers = value;
  }
}
