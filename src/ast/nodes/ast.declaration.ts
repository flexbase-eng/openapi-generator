import { Identifier } from './ast.identifier';
import { Node } from './ast.node';

export interface DeclarationNode extends Node {
  id: Identifier;
}
