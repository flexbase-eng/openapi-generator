import { OasNodeModifiers } from './oas.node.modifiers';
import { OasNodeDeclaration } from './oas.node.declaration';
import { OasNodeType } from './oas.node.type';

export class OasNodeTypeObject extends OasNodeType {
  constructor(private readonly _fields: OasNodeDeclaration[], modifiers: OasNodeModifiers) {
    super('object', modifiers);
  }

  get fields(): Readonly<OasNodeDeclaration[]> {
    return this._fields;
  }
}
