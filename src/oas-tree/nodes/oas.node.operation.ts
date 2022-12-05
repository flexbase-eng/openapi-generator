import { OasNode } from './oas.node';
import { OasNodeLiteral } from './oas.node.literal';
import { OasNodeModifiers } from './oas.node.modifiers';
import { OasNodeType } from './oas.node.type';

export type OasNodeOperationHttpMethod = 'Get' | 'Post' | 'Patch' | 'Put' | 'Delete' | 'Head' | 'Options';

export class OasNodeOperation extends OasNode {
  private readonly _identifier: OasNodeLiteral;

  constructor(
    identifier: OasNodeLiteral | string,
    private readonly _httpMethod: OasNodeOperationHttpMethod,
    private readonly _path: string,
    private _responses: OasNodeType | OasNodeType[] | undefined,
    private readonly _request: OasNodeType | undefined,
    private readonly _tags: string[] | undefined,
    modifiers: OasNodeModifiers
  ) {
    super('operation', modifiers);
    if (typeof identifier === 'string') {
      this._identifier = new OasNodeLiteral(identifier, {});
    } else {
      this._identifier = identifier;
    }
  }

  get identifier(): OasNodeLiteral {
    return this._identifier;
  }

  get httpMethod(): OasNodeOperationHttpMethod {
    return this._httpMethod;
  }

  get path(): string {
    return this._path;
  }

  get tags(): string[] | undefined {
    return this._tags;
  }

  get responses(): OasNodeType | OasNodeType[] | undefined {
    return this._responses;
  }

  /** @internal */
  set responses(value: OasNodeType | OasNodeType[] | undefined) {
    this._responses = value;
  }

  get request(): OasNodeType | undefined {
    return this._request;
  }
}
