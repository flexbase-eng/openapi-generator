import { OasNodeModifiers } from './oas.node.modifiers';
import { OasNodeType } from './oas.node.type';

export class OasNodeTypeOperationResponse extends OasNodeType {
  constructor(private readonly _statusCode: string, private readonly _response: OasNodeType | undefined, modifiers: OasNodeModifiers) {
    super('operation_response', modifiers);
  }

  get statusCode(): string {
    return this._statusCode;
  }

  get responses(): OasNodeType | undefined {
    return this._response;
  }
}
