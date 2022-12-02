import { Declaration } from './ast.declaration';

export interface ModelDeclaration extends Declaration {
  node: 'ModelDeclaration';
  referenceName?: string;
}

export const IsModelDeclaration = (obj: any): obj is ModelDeclaration => {
  return Object.hasOwn(obj, 'node') && obj.node === 'ModelDeclaration';
};
