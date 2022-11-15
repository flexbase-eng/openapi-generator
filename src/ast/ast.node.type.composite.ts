import { AstNodeModifiers } from './ast.node.modifiers';
import { AstNodeType } from './ast.node.type';

export class AstNodeTypeComposite extends AstNodeType {
  constructor(private readonly _compositeTypes: AstNodeType[], modifiers: AstNodeModifiers) {
    super(modifiers);
  }

  get compositeTypes(): Readonly<AstNodeType[]> {
    return this._compositeTypes;
  }
}
