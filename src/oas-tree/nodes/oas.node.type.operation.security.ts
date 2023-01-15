import { OasNodeModifiers } from './oas.node.modifiers';
import { OasNodeType } from './oas.node.type';
import { OasNodeTypeReference } from './oas.node.type.reference';

export class OasNodeTypeOperationSecurity extends OasNodeType {
  private readonly _securityScheme: OasNodeTypeReference;

  constructor(securityKey: OasNodeTypeReference | string, private readonly _names: string[], modifiers: OasNodeModifiers) {
    super('operation_security', modifiers);
    if (typeof securityKey === 'string') {
      this._securityScheme = new OasNodeTypeReference(securityKey, {});
    } else {
      this._securityScheme = securityKey;
    }
  }

  get securityScheme(): OasNodeTypeReference {
    return this._securityScheme;
  }

  get names(): string[] {
    return this._names;
  }
}
