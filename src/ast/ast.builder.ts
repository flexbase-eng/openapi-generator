import { OasNode } from '../oas-tree/nodes/oas.node';
import { OasNodeTypeObject } from '../oas-tree/nodes/oas.node.type.object';
import {
  IsPrimativeNode,
  IsObjectNode,
  IsArrayNode,
  IsUnionNode,
  IsCompositeNode,
  IsOmitNode,
  IsReferenceNode,
  IsContentNode,
  IsBodyNode,
  IsRequestNode,
  IsResponseNode,
  IsNodeType,
} from '../oas-tree/oas.node.utilities';
import { OpenApiSpecTree } from '../oas-tree/oas.tree';
import { ArrayExpression } from './nodes/ast.array';
import { CompositeExpression } from './nodes/ast.composite';
import { Expression } from './nodes/ast.expression';
import { IdentifierExpression } from './nodes/ast.identifier';
import { LiteralExpression } from './nodes/ast.literal';
import { MediaExpression } from './nodes/ast.media';
import { ObjectExpression, PropertyDeclaration } from './nodes/ast.object';
import { OmitExpression } from './nodes/ast.omit';
import { OperationDeclaration } from './nodes/ast.operation';
import { ReferenceExpression } from './nodes/ast.reference';
import { RequestExpression } from './nodes/ast.request';
import { ResponseExpression } from './nodes/ast.response';
import { TodoExpression } from './nodes/ast.todo';
import { UnionExpression } from './nodes/ast.union';
import { AstDocument } from './nodes/ast.document';
import { OasNodeOperation } from '../oas-tree/nodes/oas.node.operation';
import { ModelDeclaration } from './nodes/ast.model';
import { Logger } from '@flexbase/logger';
import { IAstBuilder } from './ast.builder.interface';

export class AstBuilder implements IAstBuilder {
  constructor(private readonly _logger: Logger) {}

  private makeProperties(oasNode: OasNodeTypeObject): Array<PropertyDeclaration> {
    return oasNode.fields.map(
      field =>
        <PropertyDeclaration>{
          node: 'PropertyDeclaration',
          id: <IdentifierExpression>{ node: 'IdentifierExpression', name: field.identifier.value },
          definition: this.makeExpression(field.type),
          description: field.modifiers.description,
          format: field.modifiers.format,
          multipleOf: field.modifiers.multipleOf,
          maximum: field.modifiers.maximum,
          exclusiveMaximum: field.modifiers.exclusiveMaximum,
          minimum: field.modifiers.minimum,
          exclusiveMinimum: field.modifiers.exclusiveMinimum,
          maxLength: field.modifiers.maxLength,
          minLength: field.modifiers.minLength,
          pattern: field.modifiers.pattern,
          maxItems: field.modifiers.maxItems,
          minItems: field.modifiers.minItems,
          uniqueItems: field.modifiers.uniqueItems,
          maxProperties: field.modifiers.maxProperties,
          minProperties: field.modifiers.minProperties,
          required: field.modifiers.required,
          enum: field.modifiers.enum,
          nullable: field.modifiers.nullable,
          readOnly: field.modifiers.readOnly,
          writeOnly: field.modifiers.writeOnly,
          deprecated: field.modifiers.deprecated,
        }
    );
  }

  private makeExpression(oasNode: OasNode): Expression {
    if (IsPrimativeNode(oasNode)) {
      return <LiteralExpression>{
        node: 'LiteralExpression',
        value: oasNode.primativeType,
      };
    } else if (IsObjectNode(oasNode)) {
      const properties = this.makeProperties(oasNode);

      if (properties.length === 0) {
        this._logger.info('Empty object detected');
      }

      return <ObjectExpression>{
        node: 'ObjectExpression',
        properties,
      };
    } else if (IsArrayNode(oasNode)) {
      return <ArrayExpression>{
        node: 'ArrayExpression',
        elements: this.makeExpression(oasNode.arrayType),
      };
    } else if (IsUnionNode(oasNode)) {
      return <UnionExpression>{
        node: 'UnionExpression',
        elements: oasNode.unionTypes.map(type => this.makeExpression(type)),
      };
    } else if (IsCompositeNode(oasNode)) {
      return <CompositeExpression>{
        node: 'CompositeExpression',
        elements: oasNode.compositeTypes.map(type => this.makeExpression(type)),
      };
    } else if (IsOmitNode(oasNode)) {
      return <OmitExpression>{
        node: 'OmitExpression',
        elements: this.makeExpression(oasNode.originalType),
        omit: oasNode.omitFields.map(id => <IdentifierExpression>{ node: 'IdentifierExpression', name: id }),
      };
    } else if (IsReferenceNode(oasNode)) {
      return <ReferenceExpression>{ node: 'ReferenceExpression', key: oasNode.identifier.value };
    } else if (IsContentNode(oasNode)) {
      return <MediaExpression>{
        node: 'MediaExpression',
        mediaType: oasNode.mediaType,
        body: this.makeExpression(oasNode.contentType),
      };
    } else if (IsBodyNode(oasNode)) {
      return <RequestExpression>{
        node: 'RequestExpression',
        bodies: oasNode.contents.map(content => this.makeExpression(content)),
      };
    } else if (IsRequestNode(oasNode)) {
      return <RequestExpression>{
        node: 'RequestExpression',
        bodies: oasNode.body ? [this.makeExpression(oasNode.body)] : undefined,
        pathParameters: oasNode.pathParameters ? this.makeExpression(oasNode.pathParameters) : undefined,
        cookieParameters: oasNode.cookieParameters ? this.makeExpression(oasNode.cookieParameters) : undefined,
        headerParameters: oasNode.headerParameters ? this.makeExpression(oasNode.headerParameters) : undefined,
        queryParameters: oasNode.queryParameters ? this.makeExpression(oasNode.queryParameters) : undefined,
      };
    } else if (IsResponseNode(oasNode)) {
      return <ResponseExpression>{
        node: 'ResponseExpression',
        statusCode: oasNode.statusCode,
        headers: oasNode.headers ? this.makeExpression(oasNode.headers) : undefined,
        responses: Array.isArray(oasNode.content)
          ? oasNode.content.map(content => this.makeExpression(content))
          : oasNode.content !== undefined
          ? [this.makeExpression(oasNode.content)]
          : [<LiteralExpression>{ node: 'LiteralExpression', value: 'null' }],
      };
    }

    return <TodoExpression>{ node: 'TodoExpression', what: IsNodeType(oasNode) ? oasNode.kindType : oasNode.kind };
  }

  private makeOperationDeclaration(oasOperation: OasNodeOperation): OperationDeclaration {
    const id = <IdentifierExpression>{ node: 'IdentifierExpression', name: oasOperation.identifier.value };

    return <OperationDeclaration>{
      node: 'OperationDeclaration',
      id,
      httpMethod: oasOperation.httpMethod,
      path: oasOperation.path,
      responses: oasOperation.responses
        ? Array.isArray(oasOperation.responses)
          ? oasOperation.responses.map(r => this.makeExpression(r))
          : [this.makeExpression(oasOperation.responses)]
        : [<LiteralExpression>{ node: 'LiteralExpression', value: 'null' }],
      requests: oasOperation.request ? this.makeExpression(oasOperation.request) : undefined,
    };
  }

  makeDocument(oas: OpenApiSpecTree): Node {
    const models: Array<ModelDeclaration> = [];
    const responses: Array<ModelDeclaration> = [];
    const requests: Array<ModelDeclaration> = [];
    const pathParameters: Array<ModelDeclaration> = [];
    const headerParameters: Array<ModelDeclaration> = [];
    const queryParameters: Array<ModelDeclaration> = [];
    const cookieParameters: Array<ModelDeclaration> = [];
    const referenceParameters: Array<ModelDeclaration> = [];
    const unknownParameters: Array<ModelDeclaration> = [];
    const operations: Array<OperationDeclaration> = [];

    for (const decl of oas.declarations) {
      const node: ModelDeclaration = {
        node: 'ModelDeclaration',
        id: <IdentifierExpression>{ node: 'IdentifierExpression', name: decl.identifier.value },
        definition: this.makeExpression(decl.type),
        referenceName: decl.referenceName,
        title: decl.modifiers.title,
        description: decl.modifiers.description,
        extensions: decl.modifiers.extensions,
        examples: decl.modifiers.examples,
      };

      if (decl.declarationType === 'model') {
        models.push(node);
      } else if (decl.declarationType === 'response') {
        responses.push(node);
      } else if (decl.declarationType === 'request') {
        requests.push(node);
      } else if (decl.declarationType === 'parameter') {
        const location = decl.parameterLocation ?? 'unknown';
        if (location === 'cookie') {
          cookieParameters.push(node);
        } else if (location === 'header') {
          headerParameters.push(node);
        } else if (location === 'path') {
          pathParameters.push(node);
        } else if (location === 'query') {
          queryParameters.push(node);
        } else if (location === 'reference') {
          referenceParameters.push(node);
        } else {
          unknownParameters.push(node);
        }
      } else {
        throw Error();
      }
    }

    for (const operation of oas.operations) {
      const op = this.makeOperationDeclaration(operation);
      operations.push(op);
    }

    const document = <AstDocument>{
      node: 'Document',
      title: oas.title,
      description: oas.description,
      version: oas.version,
      models,
      responses,
      requests,
      pathParameters,
      headerParameters,
      queryParameters,
      cookieParameters,
      referenceParameters,
      unknownParameters,
      operations,
    };

    return document;
  }
}
