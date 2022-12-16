import { ArrayExpression } from './ast.array';
import { CompositeExpression } from './ast.composite';
import { IdentifierExpression } from './ast.identifier';
import { LiteralExpression } from './ast.literal';
import { MediaExpression } from './ast.media';
import { ObjectExpression } from './ast.object';
import { OmitExpression } from './ast.omit';
import { ReferenceExpression } from './ast.reference';
import { RequestExpression } from './ast.request';
import { ResponseExpression } from './ast.response';
import { TodoExpression } from './ast.todo';
import { UnionExpression } from './ast.union';

export type Expression =
  | TodoExpression
  | LiteralExpression
  | ReferenceExpression
  | ObjectExpression
  | ArrayExpression
  | UnionExpression
  | CompositeExpression
  | OmitExpression
  | MediaExpression
  | RequestExpression
  | ResponseExpression
  | IdentifierExpression;
