import { ArrayExpression } from './ast.array';
import { CompositeExpression } from './ast.composite';
import { IdentifierExpression } from './ast.identifier';
import { LiteralExpression } from './ast.literal';
import { MediaExpression, MediaResponseExpression } from './ast.media';
import { ObjectExpression } from './ast.object';
import { OmitExpression } from './ast.omit';
import { ReferenceExpression } from './ast.reference';
import { RequestExpression } from './ast.request';
import { OperationResponseExpression, ResponseExpression } from './ast.response';
import { OperationSecurityExpression, SecurityExpression, SecurityOAuthFlowExpression } from './ast.security';
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
  | MediaResponseExpression
  | RequestExpression
  | ResponseExpression
  | OperationResponseExpression
  | IdentifierExpression
  | SecurityExpression
  | OperationSecurityExpression
  | SecurityOAuthFlowExpression;
