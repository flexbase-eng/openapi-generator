import { OpenApiSpecTree } from './oas.tree';
import { IOpenApiSpecConverter } from './oas.converter.interface';
import {
  IsObjectNode,
  IsArrayNode,
  IsCompositeNode,
  IsUnionNode,
  IsReferenceNode,
  IsPrimativeNode,
  IsResponseNode,
  IsRequestNode,
  IsContentNode,
  IsBodyNode,
  IsOmitNode,
  IsResponseContentNode,
  IsOperationResponseNode,
  IsSecurityApiKeyNode,
  IsSecurityHttpNode,
  IsSecurityOAuth2Node,
  IsSecurityOpenIdConnectNode,
  IsOperationSecurityNode,
} from './oas.node.utilities';
import { OasNode } from './nodes/oas.node';
import { OasNodeDeclaration } from './nodes/oas.node.declaration';
import { OasNodeLiteral } from './nodes/oas.node.literal';
import { OasNodeOperation } from './nodes/oas.node.operation';
import { OasNodeType } from './nodes/oas.node.type';
import { OasNodeTag } from './nodes/oas.node.tag';
import { OasNodeTypeSecurityOAuth2Flow } from './nodes/oas.node.type.security.oauth2';

export class OpenApiSpecConverter implements IOpenApiSpecConverter {
  convertOasToPoco(oas: OpenApiSpecTree): any {
    return {
      title: oas.title,
      description: oas.description,
      version: oas.version,
      declarations: oas.declarations.map(x => this.convertNode(x)),
      operations: oas.operations.map(x => this.convertNode(x)),
      tags: oas.tags ? oas.tags.map(x => this.convertNode(x)) : undefined,
    };
  }

  convertNode(node: OasNode): any {
    if (!node) {
      throw Error();
    }

    switch (node.kind) {
      case 'declaration':
        return this.convertDeclaration(node as OasNodeDeclaration);

      case 'literal':
        return this.convertLiteral(node as OasNodeLiteral);

      case 'operation':
        return this.convertOperation(node as OasNodeOperation);

      case 'type':
        return this.convertType(node as OasNodeType);

      case 'tag':
        return this.convertTag(node as OasNodeTag);

      default:
        throw new Error('Unknown node kind', { cause: node });
    }
  }

  convertDeclaration(node: OasNodeDeclaration) {
    return {
      kind: node.kind,
      referenceName: node.referenceName,
      declarationType: node.declarationType,
      isGenerated: node.isGenerated ? 'true' : undefined,
      parameterLocation: node.parameterLocation,
      identifier: this.convertNode(node.identifier),
      modifiers: node.modifiers,
      type: this.convertNode(node.type),
    };
  }

  convertLiteral(node: OasNodeLiteral) {
    return {
      kind: node.kind,
      value: node.value,
      modifiers: node.modifiers,
    };
  }

  convertOperation(node: OasNodeOperation): any {
    const request = node.request ? this.convertNode(node.request) : undefined;
    const responses = node.responses ? node.responses.map(r => this.convertNode(r)) : undefined;
    return {
      kind: node.kind,
      httpMethod: node.httpMethod,
      identifier: this.convertNode(node.identifier),
      path: node.path,
      responses,
      request,
      modifiers: node.modifiers,
      security: node.security ? node.security.map(x => this.convertNode(x)) : undefined,
    };
  }

  convertTag(node: OasNodeTag) {
    return {
      name: node.name,
      description: node.description,
    };
  }

  convertType(node: OasNodeType) {
    const json = {
      kind: node.kind,
      kindType: node.kindType,
      modifiers: node.modifiers,
    };

    if (IsObjectNode(node)) {
      return { ...json, fields: node.fields.map(x => this.convertNode(x)) };
    } else if (IsArrayNode(node)) {
      return { ...json, arrayType: this.convertNode(node.arrayType) };
    } else if (IsCompositeNode(node)) {
      return { ...json, compositeTypes: node.compositeTypes.map(x => this.convertNode(x)) };
    } else if (IsUnionNode(node)) {
      return { ...json, unionTypes: node.unionTypes.map(x => this.convertNode(x)) };
    } else if (IsReferenceNode(node)) {
      return { ...json, identifier: this.convertNode(node.identifier) };
    } else if (IsPrimativeNode(node)) {
      return { ...json, primativeType: node.primativeType };
    } else if (IsOperationResponseNode(node)) {
      return {
        ...json,
        statusCode: node.statusCode,
        responses: node.responses ? this.convertNode(node.responses) : undefined,
      };
    } else if (IsResponseNode(node)) {
      return {
        ...json,
        content: node.content ? node.content.map(x => this.convertNode(x)) : undefined,
      };
    } else if (IsRequestNode(node)) {
      return {
        ...json,
        body: node.body ? this.convertNode(node.body) : undefined,
        pathParameters: node.pathParameters ? this.convertNode(node.pathParameters) : undefined,
        cookieParameters: node.cookieParameters ? this.convertNode(node.cookieParameters) : undefined,
        headerParameters: node.headerParameters ? this.convertNode(node.headerParameters) : undefined,
        queryParameters: node.queryParameters ? this.convertNode(node.queryParameters) : undefined,
      };
    } else if (IsContentNode(node)) {
      return { ...json, mediaType: node.mediaType, contentType: this.convertNode(node.contentType) };
    } else if (IsResponseContentNode(node)) {
      return {
        ...json,
        mediaType: node.mediaType,
        contentType: this.convertNode(node.contentType),
        headers: node.headers ? this.convertNode(node.headers) : undefined,
      };
    } else if (IsBodyNode(node)) {
      return { ...json, contents: node.contents.map(x => this.convertNode(x)) };
    } else if (IsOmitNode(node)) {
      return { ...json, originalType: this.convertNode(node.originalType), omitFields: node.omitFields };
    } else if (IsSecurityApiKeyNode(node)) {
      return { ...json, type: node.type, name: node.name, in: node.in };
    } else if (IsSecurityHttpNode(node)) {
      return { ...json, type: node.type, scheme: node.scheme, bearerFormat: node.bearerFormat };
    } else if (IsSecurityOAuth2Node(node)) {
      return {
        ...json,
        type: node.type,
        implicitFlow: node.implicitFlow ? this.convertSecurityFlow(node.implicitFlow) : undefined,
        passwordFlow: node.passwordFlow ? this.convertSecurityFlow(node.passwordFlow) : undefined,
        clientCredentialsFlow: node.clientCredentialsFlow ? this.convertSecurityFlow(node.clientCredentialsFlow) : undefined,
        authorizationCodeFlow: node.authorizationCodeFlow ? this.convertSecurityFlow(node.authorizationCodeFlow) : undefined,
      };
    } else if (IsSecurityOpenIdConnectNode(node)) {
      return { ...json, type: node.type, openIdConnectUrl: node.openIdConnectUrl };
    } else if (IsOperationSecurityNode(node)) {
      return { ...json, securityScheme: this.convertNode(node.securityScheme), names: node.names };
    } else {
      throw Error('Unknown object node in ast', { cause: node });
    }
  }

  convertSecurityFlow(node: OasNodeTypeSecurityOAuth2Flow) {
    return {
      authorizationUrl: node.authorizationUrl,
      tokenUrl: node.tokenUrl,
      refreshUrl: node.refreshUrl,
      scopes: node.scopes,
    };
  }
}
