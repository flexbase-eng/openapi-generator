import { OasNode } from './nodes/oas.node';
import { OasNodeDeclaration } from './nodes/oas.node.declaration';
import { OasNodeLiteral } from './nodes/oas.node.literal';
import { OasNodeOperation } from './nodes/oas.node.operation';
import { OasNodeType } from './nodes/oas.node.type';
import { OasNodeTypeArray } from './nodes/oas.node.type.array';
import { OasNodeTypeBody } from './nodes/oas.node.type.body';
import { OasNodeTypeComposite } from './nodes/oas.node.type.composite';
import { OasNodeTypeContent } from './nodes/oas.node.type.content';
import { OasNodeTypeObject } from './nodes/oas.node.type.object';
import { OasNodeTypeOmit } from './nodes/oas.node.type.omit';
import { OasNodeTypeOperationResponse } from './nodes/oas.node.type.operation.response';
import { OasNodeTypePrimative } from './nodes/oas.node.type.primative';
import { OasNodeTypeReference } from './nodes/oas.node.type.reference';
import { OasNodeTypeRequest } from './nodes/oas.node.type.request';
import { OasNodeTypeResponse } from './nodes/oas.node.type.response';
import { OasNodeTypeResponseContent } from './nodes/oas.node.type.response.content';
import { OasNodeTypeUnion } from './nodes/oas.node.type.union';
import { OasNodeTypeSecurityOpenIdConnect } from './nodes/oas.node.type.security.openidconnect';
import { OasNodeTypeSecurityApiKey } from './nodes/oas.node.type.security.apikey';
import { OasNodeTypeSecurityHttp } from './nodes/oas.node.type.security.http';
import { OasNodeTypeSecurityOAuth2 } from './nodes/oas.node.type.security.oauth2';
import { OasNodeTypeOperationSecurity } from './nodes/oas.node.type.operation.security';

export function IsObjectNode(test: any): test is OasNodeTypeObject {
  return test?.kind === 'type' && test?.kindType === 'object';
}

export function IsArrayNode(test: any): test is OasNodeTypeArray {
  return test?.kind === 'type' && test?.kindType === 'array';
}

export function IsCompositeNode(test: any): test is OasNodeTypeComposite {
  return test?.kind === 'type' && test?.kindType === 'composite';
}

export function IsUnionNode(test: any): test is OasNodeTypeUnion {
  return test?.kind === 'type' && test?.kindType === 'union';
}

export function IsReferenceNode(test: any): test is OasNodeTypeReference {
  return test?.kind === 'type' && test?.kindType === 'reference';
}

export function IsPrimativeNode(test: any): test is OasNodeTypePrimative {
  return test?.kind === 'type' && test?.kindType === 'primative';
}

export function IsDeclarationNode(test: any): test is OasNodeDeclaration {
  return test?.kind === 'declaration';
}

export function IsLiteralNode(test: any): test is OasNodeLiteral {
  return test?.kind === 'literal';
}

export function IsOperationNode(test: any): test is OasNodeOperation {
  return test?.kind === 'operation';
}

export function IsResponseNode(test: any): test is OasNodeTypeResponse {
  return test?.kind === 'type' && test?.kindType === 'response';
}

export function IsRequestNode(test: any): test is OasNodeTypeRequest {
  return test?.kind === 'type' && test?.kindType === 'request';
}

export function IsContentNode(test: any): test is OasNodeTypeContent {
  return test?.kind === 'type' && test?.kindType === 'content';
}

export function IsBodyNode(test: any): test is OasNodeTypeBody {
  return test?.kind === 'type' && test?.kindType === 'body';
}

export function IsOmitNode(test: any): test is OasNodeTypeOmit {
  return test?.kind === 'type' && test?.kindType === 'omit';
}

export function IsNodeType(test: OasNode): test is OasNodeType {
  return test.kind === 'type';
}

export function IsResponseContentNode(test: any): test is OasNodeTypeResponseContent {
  return test?.kind === 'type' && test?.kindType === 'response_content';
}

export function IsOperationResponseNode(test: any): test is OasNodeTypeOperationResponse {
  return test?.kind === 'type' && test?.kindType === 'operation_response';
}

export function IsSecurityApiKeyNode(test: any): test is OasNodeTypeSecurityApiKey {
  return test?.kind === 'type' && test?.kindType === 'security' && test?.type === 'apiKey';
}

export function IsSecurityHttpNode(test: any): test is OasNodeTypeSecurityHttp {
  return test?.kind === 'type' && test?.kindType === 'security' && test?.type === 'http';
}

export function IsSecurityOAuth2Node(test: any): test is OasNodeTypeSecurityOAuth2 {
  return test?.kind === 'type' && test?.kindType === 'security' && test?.type === 'oauth2';
}

export function IsSecurityOpenIdConnectNode(test: any): test is OasNodeTypeSecurityOpenIdConnect {
  return test?.kind === 'type' && test?.kindType === 'security' && test?.type === 'openIdConnect';
}

export function IsOperationSecurityNode(test: any): test is OasNodeTypeOperationSecurity {
  return test?.kind === 'type' && test?.kindType === 'operation_security';
}
