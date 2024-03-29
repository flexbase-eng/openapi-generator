import { OasNode } from './oas.node';
import { OasNodeModifiers } from './oas.node.modifiers';

export type OasNodeKindType =
  | 'object'
  | 'array'
  | 'composite'
  | 'union'
  | 'omit'
  | 'reference'
  | 'primative'
  | 'response'
  | 'request'
  | 'content'
  | 'body'
  | 'response_content'
  | 'operation_response'
  | 'security'
  | 'operation_security';

export abstract class OasNodeType extends OasNode {
  constructor(private readonly _kindType: OasNodeKindType, modifiers: OasNodeModifiers) {
    super('type', modifiers);
  }

  get kindType(): OasNodeKindType {
    return this._kindType;
  }
}
