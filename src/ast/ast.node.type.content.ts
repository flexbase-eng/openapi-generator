import { AstNodeModifiers } from './ast.node.modifiers';
import { AstNodeType } from './ast.node.type';

export class AstNodeTypeContent extends AstNodeType {
  constructor(private readonly _mediaType: string, private readonly _contentType: AstNodeType, modifiers: AstNodeModifiers) {
    super(modifiers);
  }

  get mediaType(): string {
    return this._mediaType;
  }

  get contentType(): AstNodeType {
    return this._contentType;
  }
}
