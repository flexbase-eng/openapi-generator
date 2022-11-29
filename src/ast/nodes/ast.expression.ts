import { ArrayExpression } from './ast.array';
import { CompositeExpression } from './ast.composite';
import { Literal } from './ast.literal';
import { MediaExpression } from './ast.media';
import { ObjectExpression } from './ast.object';
import { OmitExpression } from './ast.omit';
import { Reference } from './ast.reference';
import { TODO } from './ast.todo';
import { UnionExpression } from './ast.union';

export type Expression =
  | TODO
  | Literal
  | Reference
  | ObjectExpression
  | ArrayExpression
  | UnionExpression
  | CompositeExpression
  | OmitExpression
  | MediaExpression;
