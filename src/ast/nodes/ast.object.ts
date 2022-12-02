import { Declaration } from './ast.declaration';
import { Node } from './ast.node';

export interface ObjectNode extends Node {
  properties: Array<PropertyDeclaration>;
}

export interface ObjectExpression extends ObjectNode {
  node: 'ObjectExpression';
}

export interface PropertyDeclaration extends Declaration {
  node: 'PropertyDeclaration';
}
