import { AstNode } from './ast.node';
import { AstNodeLiteral } from './ast.node.literal';
import { AstNodeModifiers } from './ast.node.modifiers';
import { AstNodeType } from './ast.node.type';

export type ParameterLocations = 'query' | 'header' | 'path' | 'cookie' | 'reference' | 'unknown';
export type DeclarationType = 'model' | 'request' | 'response' | 'parameter' | 'inline';

export class AstNodeDeclaration extends AstNode {
  private readonly _identifier: AstNodeLiteral;
  private readonly _generatedIdentifier: AstNodeLiteral;
  private _isGenerated: boolean = false;

  constructor(
    identifier: AstNodeLiteral | string,
    generatedIdentifier: AstNodeLiteral | string,
    private readonly _declarationType: DeclarationType,
    private readonly _type: AstNodeType,
    modifiers: AstNodeModifiers,
    private readonly _referenceName?: string,
    private readonly _parameterLocation?: ParameterLocations
  ) {
    super('declaration', modifiers);
    if (typeof identifier === 'string') {
      this._identifier = new AstNodeLiteral(identifier, {});
    } else {
      this._identifier = identifier;
    }
    if (typeof generatedIdentifier === 'string') {
      this._generatedIdentifier = new AstNodeLiteral(generatedIdentifier, {});
    } else {
      this._generatedIdentifier = generatedIdentifier;
    }
  }

  get identifier(): AstNodeLiteral {
    return this._identifier;
  }

  get generatedIdentifier(): AstNodeLiteral {
    return this._generatedIdentifier;
  }

  get type(): AstNodeType {
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
