import { EncodingExpression, Expression, ExpressionList } from './expression';
import { Node, NodeModifiers } from './node';

export type ObjectSpecifier =
  | 'reference'
  | 'model'
  | 'requestBody'
  | 'response'
  | 'parameter'
  | 'header'
  | 'security'
  | 'callback'
  | 'pathItem'
  | 'property';

export abstract class Declaration extends ExpressionList {
  constructor(
    private readonly _identifier: string,
    private _modifiers: NodeModifiers = {},
    private _isRequired: boolean = false,
  ) {
    super();
  }

  get identifier() {
    return this._identifier;
  }

  get modifiers(): NodeModifiers {
    return this._modifiers;
  }

  set modifiers(value: NodeModifiers) {
    this._modifiers = value;
  }

  get isRequired() {
    return this._isRequired;
  }

  set isRequired(value: boolean) {
    this._isRequired = value;
  }
}

export class ObjectDeclaration extends Declaration {
  constructor(
    identifier: string,
    private readonly _specifier: ObjectSpecifier,
    modifiers: NodeModifiers = {},
    isRequired: boolean = false,
  ) {
    super(identifier, modifiers, isRequired);
  }

  get specifier() {
    return this._specifier;
  }
}

export class ArrayDeclaration extends ObjectDeclaration {
  constructor(declaration: ObjectDeclaration) {
    super(declaration.identifier, declaration.specifier, declaration.modifiers, declaration.isRequired);
  }
}

export class CompositeDeclaration extends ObjectDeclaration {
  constructor(declaration: ObjectDeclaration) {
    super(declaration.identifier, declaration.specifier, declaration.modifiers, declaration.isRequired);
  }
}

export class UnionDeclaration extends ObjectDeclaration {
  constructor(declaration: ObjectDeclaration) {
    super(declaration.identifier, declaration.specifier, declaration.modifiers, declaration.isRequired);
  }
}

export class OneOfDeclaration extends ObjectDeclaration {
  constructor(declaration: ObjectDeclaration) {
    super(declaration.identifier, declaration.specifier, declaration.modifiers, declaration.isRequired);
  }
}

export class NotDeclaration extends ObjectDeclaration {
  constructor(declaration: ObjectDeclaration) {
    super(declaration.identifier, declaration.specifier, declaration.modifiers, declaration.isRequired);
  }
}

export class MediaContentDeclaration extends Declaration {
  private readonly _encodings: EncodingDeclaration[] = [];

  get encodings(): Readonly<EncodingDeclaration[]> {
    return this._encodings;
  }

  addEncoding(encoding?: EncodingDeclaration | EncodingDeclaration[]) {
    if (encoding) {
      if (Array.isArray(encoding)) {
        this._encodings.push(...encoding);
      } else {
        this._encodings.push(encoding);
      }
    }
  }
}

export class EncodingDeclaration extends Declaration {}

export class HeaderDeclaration extends ObjectDeclaration {
  private readonly _content: MediaContentDeclaration[] = [];

  constructor(_identifier: string) {
    super(_identifier, 'header');
  }

  get content(): Readonly<MediaContentDeclaration[]> {
    return this._content;
  }

  addContent(expression?: MediaContentDeclaration | MediaContentDeclaration[]) {
    if (expression) {
      if (Array.isArray(expression)) {
        this._content.push(...expression);
      } else {
        this._content.push(expression);
      }
    }
  }
}
