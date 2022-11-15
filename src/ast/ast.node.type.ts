import { AstNode } from './ast.node';
import { AstNodeModifiers } from './ast.node.modifiers';

export abstract class AstNodeType extends AstNode {
  constructor(modifiers: AstNodeModifiers) {
    super('type', modifiers);
  }
}
