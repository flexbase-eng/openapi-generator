import { ArrayDeclaration } from './ast.array';
import { CompositeDeclaration } from './ast.composite';
import { ObjectDeclaration } from './ast.object';
import { OmitDeclaration } from './ast.omit';
import { RequestDeclaration } from './ast.request';
import { ResponseDeclaration } from './ast.response';
import { TODO } from './ast.todo';
import { UnionDeclaration } from './ast.union';

export type ModelDeclaration =
  | TODO
  | ObjectDeclaration
  | ArrayDeclaration
  | UnionDeclaration
  | CompositeDeclaration
  | OmitDeclaration
  | RequestDeclaration
  | ResponseDeclaration;
