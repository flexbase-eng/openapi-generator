import { AstNode } from './ast.node';
import { AstNodeLiteral } from './ast.node.literal';
import { AstNodeModifiers } from './ast.node.modifiers';
import { AstNodeType } from './ast.node.type';

export class AstNodeDeclaration extends AstNode {
  private readonly _identifier: AstNodeLiteral;

  constructor(
    identifier: AstNodeLiteral | string,
    private readonly _type: AstNodeType,
    modifiers: AstNodeModifiers,
    private readonly _referenceName?: string
  ) {
    super('declaration', modifiers);
    if (typeof identifier === 'string') {
      this._identifier = new AstNodeLiteral(identifier, {});
    } else {
      this._identifier = identifier;
    }
  }

  get identifier(): AstNodeLiteral {
    return this._identifier;
  }

  get type(): AstNodeType {
    return this._type;
  }

  get referenceName(): string | undefined {
    return this._referenceName;
  }
}
