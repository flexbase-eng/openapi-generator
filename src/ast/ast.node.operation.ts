import { AstNode } from './ast.node';
import { AstNodeLiteral } from './ast.node.literal';
import { AstNodeModifiers } from './ast.node.modifiers';
import { AstNodeType } from './ast.node.type';

export type AstNodeOperationHttpMethod = 'Get' | 'Post' | 'Patch' | 'Put' | 'Delete' | 'Head' | 'Options';

export class AstNodeOperation extends AstNode {
  private readonly _identifier: AstNodeLiteral;

  constructor(
    identifier: AstNodeLiteral | string,
    private readonly _httpMethod: AstNodeOperationHttpMethod,
    private readonly _path: string,
    private _responses: AstNodeType | undefined,
    private readonly _request: AstNodeType | undefined,
    modifiers: AstNodeModifiers
  ) {
    super('operation', modifiers);
    if (typeof identifier === 'string') {
      this._identifier = new AstNodeLiteral(identifier, {});
    } else {
      this._identifier = identifier;
    }
  }

  get identifier(): AstNodeLiteral {
    return this._identifier;
  }

  get httpMethod(): AstNodeOperationHttpMethod {
    return this._httpMethod;
  }

  get path(): string {
    return this._path;
  }

  get responses(): AstNodeType | undefined {
    return this._responses;
  }

  /** @internal */
  set responses(value: AstNodeType | undefined) {
    this._responses = value;
  }

  get request(): AstNodeType | undefined {
    return this._request;
  }
}
