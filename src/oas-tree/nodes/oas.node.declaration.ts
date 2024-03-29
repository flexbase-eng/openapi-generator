import { OasNode } from './oas.node';
import { OasNodeLiteral } from './oas.node.literal';
import { OasNodeModifiers } from './oas.node.modifiers';
import { OasNodeType } from './oas.node.type';

export type ParameterLocations = 'query' | 'header' | 'path' | 'cookie' | 'reference' | 'unknown';
export type DeclarationType = 'model' | 'request' | 'response' | 'parameter' | 'inline' | 'security';

export class OasNodeDeclaration extends OasNode {
  private readonly _identifier: OasNodeLiteral;
  private _isGenerated: boolean = false;

  constructor(
    identifier: OasNodeLiteral | string,
    private readonly _declarationType: DeclarationType,
    private readonly _type: OasNodeType,
    modifiers: OasNodeModifiers,
    private readonly _referenceName?: string,
    private readonly _parameterLocation?: ParameterLocations
  ) {
    super('declaration', modifiers);
    if (typeof identifier === 'string') {
      this._identifier = new OasNodeLiteral(identifier, {});
    } else {
      this._identifier = identifier;
    }
  }

  get identifier(): OasNodeLiteral {
    return this._identifier;
  }

  get type(): OasNodeType {
    return this._type;
  }

  get declarationType(): DeclarationType {
    return this._declarationType;
  }

  get referenceName(): string | undefined {
    return this._referenceName;
  }

  get parameterLocation(): ParameterLocations | undefined {
    return this._parameterLocation;
  }

  get isGenerated(): boolean {
    return this._isGenerated;
  }

  set isGenerated(value: boolean) {
    this._isGenerated = value;
  }
}
