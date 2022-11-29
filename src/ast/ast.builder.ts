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
} from '../oas-tree/oas.node.utilities';
import { OpenApiSpecTree } from '../oas-tree/oas.tree';
import { ArrayExpression, ArrayDeclaration } from './nodes/ast.array';
import { CompositeExpression, CompositeDeclaration } from './nodes/ast.composite';
import { Expression } from './nodes/ast.expression';
import { Identifier } from './nodes/ast.identifier';
import { Literal } from './nodes/ast.literal';
import { MediaExpression } from './nodes/ast.media';
import { ModelDeclaration } from './nodes/ast.model';
import { Property, ObjectExpression, ObjectDeclaration } from './nodes/ast.object';
import { OmitExpression, OmitDeclaration } from './nodes/ast.omit';
import { OperationDeclaration } from './nodes/ast.operation';
import { Reference } from './nodes/ast.reference';
import { RequestDeclaration } from './nodes/ast.request';
import { ResponseDeclaration } from './nodes/ast.response';
import { TODO } from './nodes/ast.todo';
import { UnionExpression, UnionDeclaration } from './nodes/ast.union';
import { AstDocument } from './nodes/ast.document';

function makeProperties(oasNode: OasNodeTypeObject): Array<Property> {
  return oasNode.fields.map(
    field =>
      <Property>{
        node: 'Property',
        key: <Identifier>{ node: 'Identifier', name: field.identifier.value },
        type: makeExpression(field.type),
      }
  );
}

function makeExpression(oasNode: OasNode): Expression {
  if (IsPrimativeNode(oasNode)) {
    return <Literal>{
      node: 'Literal',
      value: oasNode.primativeType,
    };
  } else if (IsObjectNode(oasNode)) {
    return <ObjectExpression>{
      node: 'ObjectExpression',
      properties: makeProperties(oasNode),
    };
  } else if (IsArrayNode(oasNode)) {
    return <ArrayExpression>{
      node: 'ArrayExpression',
      elements: makeExpression(oasNode.arrayType),
    };
  } else if (IsUnionNode(oasNode)) {
    return <UnionExpression>{
      node: 'UnionExpression',
      elements: <TODO>{ node: 'TODO', description: 'union types' },
    };
  } else if (IsCompositeNode(oasNode)) {
    return <CompositeExpression>{
      node: 'CompositeExpression',
      elements: oasNode.compositeTypes.map(type => makeExpression(type)),
    };
  } else if (IsOmitNode(oasNode)) {
    return <OmitExpression>{
      node: 'OmitExpression',
      elements: makeExpression(oasNode.originalType),
      omit: oasNode.omitFields,
    };
  } else if (IsReferenceNode(oasNode)) {
    return <Reference>{ node: 'Reference', refName: oasNode.identifier.value };
  } else if (IsContentNode(oasNode)) {
    return <MediaExpression>{
      node: 'MediaExpression',
      mediaType: oasNode.mediaType,
      body: makeExpression(oasNode.contentType),
    };
  }

  return <TODO>{ node: 'TODO', description: oasNode.kind };
}

function makeModelDeclaration(oasNode: OasNode, id: Identifier): ModelDeclaration {
  if (IsObjectNode(oasNode)) {
    return <ObjectDeclaration>{
      node: 'ObjectDeclaration',
      id,
      properties: makeProperties(oasNode),
    };
  } else if (IsArrayNode(oasNode)) {
    return <ArrayDeclaration>{
      node: 'ArrayDeclaration',
      id,
      elements: makeExpression(oasNode.arrayType),
    };
  } else if (IsUnionNode(oasNode)) {
    return <UnionDeclaration>{
      node: 'UnionDeclaration',
      id,
      elements: <TODO>{ node: 'TODO', description: 'union types' },
    };
  } else if (IsCompositeNode(oasNode)) {
    return <CompositeDeclaration>{
      node: 'CompositeDeclaration',
      id,
      elements: oasNode.compositeTypes.map(type => makeExpression(type)),
    };
  } else if (IsOmitNode(oasNode)) {
    return <OmitDeclaration>{
      node: 'OmitDeclaration',
      id,
      elements: makeExpression(oasNode.originalType),
      omit: oasNode.omitFields,
    };
  } else if (IsReferenceNode(oasNode)) {
    return <TODO>{ node: 'TODO', id, description: 'reference ' + oasNode.identifier.value };
  } else if (IsBodyNode(oasNode)) {
    return <RequestDeclaration>{
      node: 'RequestDeclaration',
      id,
      requests: oasNode.contents.map(content => makeExpression(content)),
    };
  } else if (IsContentNode(oasNode)) {
    return <TODO>{ node: 'TODO', id, description: 'content' };
  } else if (IsRequestNode(oasNode)) {
    return <TODO>{ node: 'TODO', id, description: 'request' };
  } else if (IsResponseNode(oasNode)) {
    return <ResponseDeclaration>{
      node: 'ResponseDeclaration',
      headers: oasNode.headers ? makeExpression(oasNode.headers) : undefined,
      responses: Array.isArray(oasNode.content)
        ? oasNode.content.map(content => makeExpression(content))
        : oasNode.content !== undefined
        ? makeExpression(oasNode.content)
        : undefined,
    };
  } else {
    return <TODO>{ node: 'TODO', id, description: oasNode.kind };
  }
}

export function makeDocument(oas: OpenApiSpecTree): Node {
  const models: Array<ModelDeclaration> = [];
  const responses: Array<ModelDeclaration> = [];
  const requests: Array<ModelDeclaration> = [];
  const parameters: Array<ModelDeclaration> = [];
  const operations: Array<OperationDeclaration> = [];

  for (const decl of oas.declarations) {
    const id = <Identifier>{ node: 'Identifier', name: decl.identifier.value };
    const node = makeModelDeclaration(decl.type, id);

    if (decl.declarationType === 'model') {
      if (Array.isArray(node)) models.push(...node);
      else models.push(node);
    } else if (decl.declarationType === 'response') {
      if (Array.isArray(node)) responses.push(...node);
      else responses.push(node);
    } else if (decl.declarationType === 'request') {
      if (Array.isArray(node)) requests.push(...node);
      else requests.push(node);
    } else if (decl.declarationType === 'parameter') {
      if (Array.isArray(node)) parameters.push(...node);
      else parameters.push(node);
    } else {
      throw Error();
    }
  }

  for (const operation of oas.operations) {
    const id = <Identifier>{ node: 'Identifier', name: operation.identifier.value };
    operations.push(<OperationDeclaration>{ node: 'OperationDeclaration', id });
  }

  const document = <AstDocument>{
    node: 'Document',
    title: oas.title,
    description: oas.description,
    version: oas.version,
    models,
    responses,
    requests,
    parameters,
    operations,
  };

  return document;
}
