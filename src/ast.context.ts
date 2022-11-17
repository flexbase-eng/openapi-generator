import Mustache from 'mustache';
import {
  IsArrayNode,
  IsBodyNode,
  IsCompositeNode,
  IsContentNode,
  IsDeclarationNode,
  IsLiteralNode,
  IsObjectNode,
  IsOmitNode,
  IsOperationNode,
  IsPrimativeNode,
  IsReferenceNode,
  IsRequestNode,
  IsResponseNode,
  IsUnionNode,
} from './ast/ast.utilities';

export class AstContext extends Mustache.Context {
  constructor(view: any, parentContext?: Mustache.Context) {
    super(view, parentContext);
  }
  push(view: any): Mustache.Context {
    if (typeof view === 'object') {
      const viewWrapper = {
        ...view,
        functions: {
          isObjectNode: IsObjectNode(view),
          isArrayNode: IsArrayNode(view),
          isCompositeNode: IsCompositeNode(view),
          isUnionNode: IsUnionNode(view),
          isReferenceNode: IsReferenceNode(view),
          isPrimativeNode: IsPrimativeNode(view),
          isDeclarationNode: IsDeclarationNode(view),
          isLiteralNode: IsLiteralNode(view),
          isOperationNode: IsOperationNode(view),
          isResponseNode: IsResponseNode(view),
          isRequestNode: IsRequestNode(view),
          isContentNode: IsContentNode(view),
          isBodyNode: IsBodyNode(view),
          isOmitNode: IsOmitNode(view),
          self: view,
        },
      };
      return new AstContext(viewWrapper, this);
    } else {
      return new AstContext(view, this);
    }
  }

  lookup(name: string): any {
    if (name.startsWith('self.')) {
      const selfName = name.substring('self.'.length);
      const exists = Object.hasOwn(this.view, selfName);
      return exists ? this.view[selfName] : undefined;
    }

    const matches = /(functions\.\w+)\((.+)\)/g.exec(name);
    if (matches) {
      const func = matches[1];
      const args = matches[2];

      const result = super.lookup(func);

      if (result === undefined) {
        return result;
      }

      return function (text: string, render: any) {
        return result(text, render, args);
      };
    } else {
      return super.lookup(name);
    }
  }
}
