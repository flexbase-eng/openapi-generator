import { AstNodeModifiers } from './ast.node.modifiers';
import { AstNodeType } from './ast.node.type';
import { AstNodeTypeContent } from './ast.node.type.content';

export class AstNodeTypeBody extends AstNodeType {
  constructor(private readonly _contents: AstNodeTypeContent[], modifiers: AstNodeModifiers) {
    super(modifiers);
  }

  get contents(): AstNodeTypeContent[] {
    return this._contents;
  }
}
