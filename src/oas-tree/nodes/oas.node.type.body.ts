import { OasNodeModifiers } from './oas.node.modifiers';
import { OasNodeType } from './oas.node.type';
import { OasNodeTypeContent } from './oas.node.type.content';

export class OasNodeTypeBody extends OasNodeType {
  constructor(private readonly _contents: OasNodeTypeContent[], modifiers: OasNodeModifiers) {
    super('body', modifiers);
  }

  get contents(): OasNodeTypeContent[] {
    return this._contents;
  }
}
