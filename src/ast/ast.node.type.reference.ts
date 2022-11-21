import { AstNodeModifiers } from './ast.node.modifiers';
import { AstNodeLiteral } from './ast.node.literal';
import { AstNodeType } from './ast.node.type';

export class AstNodeTypeReference extends AstNodeType {
  private readonly _identifier: AstNodeLiteral;

  constructor(identifier: AstNodeLiteral | string, modifiers: AstNodeModifiers) {
    super('reference', modifiers);
    if (typeof identifier === 'string') {
      this._identifier = new AstNodeLiteral(identifier, {});
    } else {
      this._identifier = identifier;
    }
  }

  get identifier(): AstNodeLiteral {
    return this._identifier;
  }
}
