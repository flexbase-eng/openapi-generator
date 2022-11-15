import { AstNodeModifiers } from './ast.node.modifiers';
import { AstNodeType } from './ast.node.type';

export class AstNodeTypeResponse extends AstNodeType {
  constructor(
    private readonly _statusCode: string,
    private readonly _content: AstNodeType | undefined,
    private readonly _headers: AstNodeType[],
    modifiers: AstNodeModifiers
  ) {
    super(modifiers);
  }

  get statusCode(): string {
    return this._statusCode;
  }

  get content(): AstNodeType | undefined {
    return this._content;
  }

  get headers(): Readonly<AstNodeType[]> {
    return this._headers;
  }
}
