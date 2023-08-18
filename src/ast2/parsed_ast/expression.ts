import { Node, NodeModifiers } from './node';

export abstract class Expression {}

export abstract class ExpressionList extends Expression {
  constructor(private readonly _expressions: Expression[] = []) {
    super();
  }

  get expressions(): Readonly<Expression[]> {
    return this._expressions;
  }

  addExpression(expression?: Expression | Expression[]) {
    if (expression) {
      if (Array.isArray(expression)) {
        this._expressions.push(...expression);
      } else {
        this._expressions.push(expression);
      }
    }
  }
}

export class ReferenceExpression extends Expression {
  constructor(private readonly _reference: string) {
    super();
  }
}

export class PrimativeExpression extends Expression {
  constructor(private readonly _type: 'string' | 'number' | 'boolean' | 'integer' | 'null') {
    super();
  }
}

export class EncodingExpression extends ExpressionList {
  private readonly _headers: Expression[] = [];

  constructor(
    private readonly _contentType?: string,
    private readonly _style?: string,
    private readonly _explode?: boolean,
    private readonly _allowReserved?: boolean,
  ) {
    super();
  }

  get headers(): Readonly<Expression[]> {
    return this._headers;
  }

  addHeader(expression?: Expression | Expression[]) {
    if (expression) {
      if (Array.isArray(expression)) {
        this._headers.push(...expression);
      } else {
        this._headers.push(expression);
      }
    }
  }
}

export class HeaderExpression extends Expression {
  constructor(
    private readonly _description?: string,
    private readonly _required?: boolean,
    private readonly _deprecated?: boolean,
    private readonly _allowEmptyValue?: boolean,
    private readonly _style?: string,
    private readonly _explode?: boolean,
    private readonly _allowReserved?: boolean,
  ) {
    super();
  }
}
