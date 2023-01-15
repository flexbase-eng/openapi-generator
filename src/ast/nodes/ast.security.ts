import { Expression } from './ast.expression';
import { Node } from './ast.node';

export interface SecurityNode extends Node {
  scheme: Expression;
}

export interface SecurityOAuthFlowExpression extends Node {
  node: 'SecurityOAuthFlowExpression';
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export interface SecurityExpression extends SecurityNode {
  node: 'SecurityExpression';
  name?: string;
  location?: 'query' | 'header' | 'cookie';
  bearerFormat?: string;
  openIdConnectUrl?: string;
  implicitFlow?: SecurityOAuthFlowExpression;
  passwordFlow?: SecurityOAuthFlowExpression;
  clientCredentialsFlow?: SecurityOAuthFlowExpression;
  authorizationCodeFlow?: SecurityOAuthFlowExpression;
}

export interface OperationSecurityExpression extends SecurityNode {
  node: 'OperationSecurityExpression';
  names: string[];
}

export function IsSecurityExpression(node: Node): node is SecurityExpression {
  return node.node === 'SecurityExpression';
}

export function IsSecurityOAuthFlowExpression(node: Node): node is SecurityOAuthFlowExpression {
  return node.node === 'SecurityOAuthFlowExpression';
}

export function IsOperationSecurityExpression(node: Node): node is OperationSecurityExpression {
  return node.node === 'OperationSecurityExpression';
}
