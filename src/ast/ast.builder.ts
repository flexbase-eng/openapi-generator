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
import { ArrayExpression, IsArrayExpression } from './nodes/ast.array';
import { CompositeExpression, IsCompositeExpression } from './nodes/ast.composite';
import { Expression } from './nodes/ast.expression';
import { IdentifierExpression } from './nodes/ast.identifier';
import { IsLiteralExpression, LiteralExpression } from './nodes/ast.literal';
import { IsMediaExpression, MediaExpression } from './nodes/ast.media';
import { IsObjectExpression, ObjectExpression, PropertyDeclaration } from './nodes/ast.object';
import { IsOmitExpression, OmitExpression } from './nodes/ast.omit';
import { OperationDeclaration } from './nodes/ast.operation';
import { IsReferenceExpression, ReferenceExpression } from './nodes/ast.reference';
import { IsRequestExpression, RequestExpression } from './nodes/ast.request';
import { IsResponseExpression, ResponseExpression } from './nodes/ast.response';
import { TodoExpression } from './nodes/ast.todo';
import { IsUnionExpression, UnionExpression } from './nodes/ast.union';
import { AstDocument } from './nodes/ast.document';
import { OasNodeOperation } from '../oas-tree/nodes/oas.node.operation';
import { IsModelDeclaration, ModelDeclaration } from './nodes/ast.model';
import { Logger } from '@flexbase/logger';
import { IAstBuilder } from './ast.builder.interface';
import { TagNode } from './nodes/ast.tag';
import { Declaration } from './nodes/ast.declaration';
import { v4 as uuidv4 } from 'uuid';

const ASTDOCUMENT_GLOBAL_TAGS = 'ASTDOCUMENT_GLOBAL_TAGS';

export class AstBuilder implements IAstBuilder {
  constructor(private readonly _logger: Logger) {}

  private makePropertyExpressions(oasNode: OasNodeTypeObject): Array<PropertyDeclaration> {
    return oasNode.fields.map(
      field =>
        <PropertyDeclaration>{
          node: 'PropertyDeclaration',
          astId: uuidv4(),
          id: <IdentifierExpression>{ node: 'IdentifierExpression', name: field.identifier.value },
          definition: this.makeExpression(field.type),
          description: field.modifiers.description ?? field.type.modifiers.description,
          format: field.modifiers.format ?? field.type.modifiers.format,
          multipleOf: field.modifiers.multipleOf ?? field.type.modifiers.multipleOf,
          maximum: field.modifiers.maximum ?? field.type.modifiers.maximum,
          exclusiveMaximum: field.modifiers.exclusiveMaximum ?? field.type.modifiers.exclusiveMaximum,
          minimum: field.modifiers.minimum ?? field.type.modifiers.minimum,
          exclusiveMinimum: field.modifiers.exclusiveMinimum ?? field.type.modifiers.exclusiveMinimum,
          maxLength: field.modifiers.maxLength ?? field.type.modifiers.maxLength,
          minLength: field.modifiers.minLength ?? field.type.modifiers.minLength,
          pattern: field.modifiers.pattern ?? field.type.modifiers.pattern,
          maxItems: field.modifiers.maxItems ?? field.type.modifiers.maxItems,
          minItems: field.modifiers.minItems ?? field.type.modifiers.minItems,
          uniqueItems: field.modifiers.uniqueItems ?? field.type.modifiers.uniqueItems,
          maxProperties: field.modifiers.maxProperties ?? field.type.modifiers.maxProperties,
          minProperties: field.modifiers.minProperties ?? field.type.modifiers.minProperties,
          required: field.modifiers.required ?? field.type.modifiers.required,
          enum: field.modifiers.enum ?? field.type.modifiers.enum,
          nullable: field.modifiers.nullable ?? field.type.modifiers.nullable,
          readOnly: field.modifiers.readOnly ?? field.type.modifiers.readOnly,
          writeOnly: field.modifiers.writeOnly ?? field.type.modifiers.writeOnly,
          deprecated: field.modifiers.deprecated ?? field.type.modifiers.deprecated,
        }
    );
  }

  private makeExpression(oasNode: OasNode): Expression {
    if (IsPrimativeNode(oasNode)) {
      return <LiteralExpression>{
        node: 'LiteralExpression',
        astId: uuidv4(),
        value: oasNode.primativeType,
      };
    } else if (IsObjectNode(oasNode)) {
      const properties = this.makePropertyExpressions(oasNode);

      if (properties.length === 0) {
        this._logger.info('Empty object detected');
      }

      return <ObjectExpression>{
        node: 'ObjectExpression',
        astId: uuidv4(),
        properties,
      };
    } else if (IsArrayNode(oasNode)) {
      return <ArrayExpression>{
        node: 'ArrayExpression',
        astId: uuidv4(),
        elements: this.makeExpression(oasNode.arrayType),
      };
    } else if (IsUnionNode(oasNode)) {
      return <UnionExpression>{
        node: 'UnionExpression',
        astId: uuidv4(),
        elements: oasNode.unionTypes.map(type => this.makeExpression(type)),
      };
    } else if (IsCompositeNode(oasNode)) {
      return <CompositeExpression>{
        node: 'CompositeExpression',
        astId: uuidv4(),
        elements: oasNode.compositeTypes.map(type => this.makeExpression(type)),
      };
    } else if (IsOmitNode(oasNode)) {
      return <OmitExpression>{
        node: 'OmitExpression',
        astId: uuidv4(),
        elements: this.makeExpression(oasNode.originalType),
        omit: oasNode.omitFields.map(id => <IdentifierExpression>{ node: 'IdentifierExpression', astId: uuidv4(), name: id }),
      };
    } else if (IsReferenceNode(oasNode)) {
      return <ReferenceExpression>{ node: 'ReferenceExpression', astId: uuidv4(), key: oasNode.identifier.value };
    } else if (IsContentNode(oasNode)) {
      return <MediaExpression>{
        node: 'MediaExpression',
        astId: uuidv4(),
        mediaType: oasNode.mediaType,
        body: this.makeExpression(oasNode.contentType),
      };
    } else if (IsBodyNode(oasNode)) {
      return <RequestExpression>{
        node: 'RequestExpression',
        astId: uuidv4(),
        bodies: oasNode.contents.map(content => this.makeExpression(content)),
      };
    } else if (IsRequestNode(oasNode)) {
      return <RequestExpression>{
        node: 'RequestExpression',
        astId: uuidv4(),
        bodies: oasNode.body ? [this.makeExpression(oasNode.body)] : undefined,
        pathParameters: oasNode.pathParameters ? this.makeExpression(oasNode.pathParameters) : undefined,
        cookieParameters: oasNode.cookieParameters ? this.makeExpression(oasNode.cookieParameters) : undefined,
        headerParameters: oasNode.headerParameters ? this.makeExpression(oasNode.headerParameters) : undefined,
        queryParameters: oasNode.queryParameters ? this.makeExpression(oasNode.queryParameters) : undefined,
      };
    } else if (IsResponseNode(oasNode)) {
      return <ResponseExpression>{
        node: 'ResponseExpression',
        astId: uuidv4(),
        statusCode: oasNode.statusCode,
        headers: oasNode.headers ? this.makeExpression(oasNode.headers) : undefined,
        responses: Array.isArray(oasNode.content)
          ? oasNode.content.map(content => this.makeExpression(content))
          : oasNode.content !== undefined
          ? [this.makeExpression(oasNode.content)]
          : [<LiteralExpression>{ node: 'LiteralExpression', astId: uuidv4(), value: 'null' }],
      };
    }

    return <TodoExpression>{ node: 'TodoExpression', astId: uuidv4(), what: IsNodeType(oasNode) ? oasNode.kindType : oasNode.kind };
  }

  private makeOperationDeclaration(oasOperation: OasNodeOperation): OperationDeclaration {
    const id = <IdentifierExpression>{ node: 'IdentifierExpression', astId: uuidv4(), name: oasOperation.identifier.value };

    return <OperationDeclaration>{
      node: 'OperationDeclaration',
      astId: uuidv4(),
      id,
      httpMethod: oasOperation.httpMethod,
      path: oasOperation.path,
      responses: oasOperation.responses
        ? Array.isArray(oasOperation.responses)
          ? oasOperation.responses.map(r => this.makeExpression(r))
          : [this.makeExpression(oasOperation.responses)]
        : [<LiteralExpression>{ node: 'LiteralExpression', astId: uuidv4(), value: 'null' }],
      requests: oasOperation.request ? this.makeExpression(oasOperation.request) : undefined,
      title: oasOperation.modifiers.title,
      description: oasOperation.modifiers.description,
      extensions: oasOperation.modifiers.extensions,
      examples: oasOperation.modifiers.examples,
      deprecated: oasOperation.modifiers.deprecated,
      tags: oasOperation.modifiers.tags,
    };
  }

  makeDocument(oas: OpenApiSpecTree): AstDocument {
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
    const tags: Array<TagNode> = [];

    for (const decl of oas.declarations) {
      const node: ModelDeclaration = {
        node: 'ModelDeclaration',
        astId: uuidv4(),
        id: <IdentifierExpression>{ node: 'IdentifierExpression', astId: uuidv4(), name: decl.identifier.value },
        definition: this.makeExpression(decl.type),
        referenceName: decl.referenceName,
        title: decl.modifiers.title,
        description: decl.modifiers.description,
        extensions: decl.modifiers.extensions,
        examples: decl.modifiers.examples,
        deprecated: decl.modifiers.deprecated,
        tags: decl.modifiers.tags,
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

    if (oas.tags) {
      tags.push(...oas.tags.map(tag => <TagNode>{ node: 'TagNode', astId: uuidv4(), name: tag.name, description: tag.description }));
    }

    const document = <AstDocument>{
      node: 'Document',
      astId: uuidv4(),
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
      tags,
    };

    return document;
  }

  private createDocumentFromTag(
    tagMap: Map<string, AstDocument>,
    name: string,
    description: string | undefined,
    version: string | undefined
  ): AstDocument {
    let doc = tagMap.get(name);
    if (!doc) {
      doc = <AstDocument>{
        node: 'Document',
        astId: uuidv4(),
        title: name,
        description: description,
        version: version,
        models: [],
        responses: [],
        requests: [],
        pathParameters: [],
        headerParameters: [],
        queryParameters: [],
        cookieParameters: [],
        referenceParameters: [],
        unknownParameters: [],
        operations: [],
        tags: [],
      };
      tagMap.set(name, doc);
    }

    return doc;
  }

  private addDeclarationsToTagMap(tagMap: Map<string, AstDocument>, property: string, declaration: Declaration[], version: string | undefined) {
    for (const decl of declaration) {
      if (decl.tags) {
        for (const tag of decl.tags) {
          const doc = this.createDocumentFromTag(tagMap, tag, undefined, version);
          (doc as any)[property].push(decl);
        }
      } else {
        const doc = this.createDocumentFromTag(tagMap, ASTDOCUMENT_GLOBAL_TAGS, undefined, version);
        (doc as any)[property].push(decl);
      }
    }
  }

  organizeByTags(astDocument: AstDocument): AstDocument[] {
    const tagMap = new Map<string, AstDocument>();
    const version = astDocument.version;

    const globalDoc = this.createDocumentFromTag(tagMap, ASTDOCUMENT_GLOBAL_TAGS, astDocument.description, version);
    globalDoc.title = astDocument.title;

    for (const tag of astDocument.tags) {
      this.createDocumentFromTag(tagMap, tag.name, tag.description, version);
    }

    this.addDeclarationsToTagMap(tagMap, 'models', astDocument.models, version);
    this.addDeclarationsToTagMap(tagMap, 'responses', astDocument.responses, version);
    this.addDeclarationsToTagMap(tagMap, 'requests', astDocument.requests, version);
    this.addDeclarationsToTagMap(tagMap, 'pathParameters', astDocument.pathParameters, version);
    this.addDeclarationsToTagMap(tagMap, 'headerParameters', astDocument.headerParameters, version);
    this.addDeclarationsToTagMap(tagMap, 'queryParameters', astDocument.queryParameters, version);
    this.addDeclarationsToTagMap(tagMap, 'cookieParameters', astDocument.cookieParameters, version);
    this.addDeclarationsToTagMap(tagMap, 'referenceParameters', astDocument.referenceParameters, version);
    this.addDeclarationsToTagMap(tagMap, 'operations', astDocument.operations, version);

    //copy global/shared tags to other docs
    tagMap.delete(ASTDOCUMENT_GLOBAL_TAGS);

    if (globalDoc.operations.length > 0) {
      this._logger.warn(
        "Warning the following operations aren't assigned a tag and will not be used",
        globalDoc.operations.map(op => op.id.name)
      );
    }

    for (const kvp of tagMap) {
      const doc = kvp[1];
      doc.models.push(...globalDoc.models);
      doc.responses.push(...globalDoc.responses);
      doc.requests.push(...globalDoc.requests);
      doc.pathParameters.push(...globalDoc.pathParameters);
      doc.headerParameters.push(...globalDoc.headerParameters);
      doc.queryParameters.push(...globalDoc.queryParameters);
      doc.cookieParameters.push(...globalDoc.cookieParameters);
      doc.referenceParameters.push(...globalDoc.referenceParameters);
    }

    const docs = Array.from(tagMap.values());

    return docs.length > 0 ? docs : [astDocument];
  }

  private flatten(references: Map<string, ModelDeclaration>, expression: Expression, resolveReference: boolean): Expression {
    if (IsReferenceExpression(expression) && resolveReference) {
      const model = references.get(expression.key);
      if (!model) {
        this._logger.warn(`Unable to find reference ${expression.key}`);
      } else {
        return model.definition;
      }
    } else if (IsObjectExpression(expression)) {
      expression.properties.forEach(x => (x.definition = this.flatten(references, x.definition, resolveReference)));
    } else if (IsArrayExpression(expression)) {
      expression.elements = this.flatten(references, expression.elements, resolveReference);
    } else if (IsUnionExpression(expression)) {
      expression.elements = expression.elements.map(x => this.flatten(references, x, resolveReference));
    } else if (IsCompositeExpression(expression)) {
      expression.elements = expression.elements.map(x => this.flatten(references, x, resolveReference));

      // get all objects and join them
      const properties = expression.elements.filter(IsObjectExpression).flatMap(x => x.properties);

      if (properties.length > 0) {
        expression.elements = expression.elements
          .filter(x => !IsObjectExpression(x))
          .concat(<ObjectExpression>{ node: 'ObjectExpression', astId: uuidv4(), properties });
      }
    } else if (IsOmitExpression(expression)) {
      expression.elements = this.flatten(references, expression.elements, true);

      // get all objects and remove omit properties
      if (IsObjectExpression(expression.elements)) {
        const omitNames = new Set(expression.omit.map(x => x.name));
        const properties = expression.elements.properties.filter(x => !omitNames.has(x.id.name));
        expression = <ObjectExpression>{ node: 'ObjectExpression', astId: uuidv4(), properties };
      }
    } else if (IsMediaExpression(expression)) {
      expression.body = this.flatten(references, expression.body, resolveReference);
    } else if (IsRequestExpression(expression)) {
      if (expression.bodies) {
        expression.bodies = expression.bodies.map(x => this.flatten(references, x, resolveReference));
      }
      if (expression.pathParameters) {
        expression.pathParameters = this.flatten(references, expression.pathParameters, resolveReference);
      }
      if (expression.cookieParameters) {
        expression.cookieParameters = this.flatten(references, expression.cookieParameters, resolveReference);
      }
      if (expression.headerParameters) {
        expression.headerParameters = this.flatten(references, expression.headerParameters, resolveReference);
      }
      if (expression.queryParameters) {
        expression.queryParameters = this.flatten(references, expression.queryParameters, resolveReference);
      }
    } else if (IsResponseExpression(expression)) {
      if (expression.headers) {
        expression.headers = this.flatten(references, expression.headers, resolveReference);
      }
      if (expression.responses) {
        expression.responses = expression.responses.map(x => this.flatten(references, x, resolveReference));
      }
    }
    return expression;
  }

  flattenReferences(astDocument: AstDocument, resolveReferences: boolean): void {
    const references = new Map<string, ModelDeclaration>();

    astDocument.models.filter(IsModelDeclaration).forEach(m => references.set(m.referenceName ?? m.id.name, m));
    astDocument.responses.filter(IsModelDeclaration).forEach(m => references.set(m.referenceName ?? m.id.name, m));
    astDocument.requests.filter(IsModelDeclaration).forEach(m => references.set(m.referenceName ?? m.id.name, m));
    astDocument.pathParameters.filter(IsModelDeclaration).forEach(m => references.set(m.referenceName ?? m.id.name, m));
    astDocument.headerParameters.filter(IsModelDeclaration).forEach(m => references.set(m.referenceName ?? m.id.name, m));
    astDocument.queryParameters.filter(IsModelDeclaration).forEach(m => references.set(m.referenceName ?? m.id.name, m));
    astDocument.cookieParameters.filter(IsModelDeclaration).forEach(m => references.set(m.referenceName ?? m.id.name, m));
    astDocument.referenceParameters.filter(IsModelDeclaration).forEach(m => references.set(m.referenceName ?? m.id.name, m));

    astDocument.models.filter(IsModelDeclaration).forEach(m => (m.definition = this.flatten(references, m.definition, resolveReferences)));
    astDocument.responses.filter(IsModelDeclaration).forEach(m => (m.definition = this.flatten(references, m.definition, resolveReferences)));
    astDocument.requests.filter(IsModelDeclaration).forEach(m => (m.definition = this.flatten(references, m.definition, resolveReferences)));
    astDocument.pathParameters.filter(IsModelDeclaration).forEach(m => (m.definition = this.flatten(references, m.definition, resolveReferences)));
    astDocument.headerParameters.filter(IsModelDeclaration).forEach(m => (m.definition = this.flatten(references, m.definition, resolveReferences)));
    astDocument.queryParameters.filter(IsModelDeclaration).forEach(m => (m.definition = this.flatten(references, m.definition, resolveReferences)));
    astDocument.cookieParameters.filter(IsModelDeclaration).forEach(m => (m.definition = this.flatten(references, m.definition, resolveReferences)));
    astDocument.referenceParameters
      .filter(IsModelDeclaration)
      .forEach(m => (m.definition = this.flatten(references, m.definition, resolveReferences)));

    const flattenResponse = (expression: ResponseExpression) => {
      const headers: Expression[] = expression.headers ? [expression.headers] : [];
      if (expression.responses) {
        const nonRefs = expression.responses.filter(x => !IsReferenceExpression(x));
        const refs = expression.responses.filter(IsReferenceExpression).map(x => this.flatten(references, x, true));
        expression.responses = refs.concat(nonRefs);

        headers.push(
          ...expression.responses
            .filter(IsResponseExpression)
            .filter(x => x.headers)
            .map(x => x.headers!)
        );
      }
      if (headers.length > 1) {
        expression.headers = <UnionExpression>{ node: 'UnionExpression', astId: uuidv4(), elements: headers };
      } else if (headers.length === 1) {
        expression.headers = headers[0];
      }
    };

    for (const operation of astDocument.operations) {
      (operation.responses ?? []).forEach(flattenResponse);
    }
  }

  private findReferences(
    referenceLookup: Map<string, string>,
    references: Map<string, string[]>,
    expression: Expression | undefined,
    ownerList: string[]
  ) {
    if (expression === undefined || IsLiteralExpression(expression)) {
      return;
    }

    const updatedOwnerList = [...ownerList];
    updatedOwnerList.push(expression.astId);
    if (!references.has(expression.astId)) {
      references.set(expression.astId, ownerList);
    }

    if (IsReferenceExpression(expression)) {
      const modelId = referenceLookup.get(expression.key);
      if (!modelId) {
        this._logger.warn(`Unable to find reference ${expression.key}`);
      } else {
        const model = references.get(modelId);
        if (!model) {
          references.set(modelId, updatedOwnerList);
        } else {
          model.push(...updatedOwnerList);
        }
      }
    } else if (IsObjectExpression(expression)) {
      expression.properties.forEach(x => this.findReferences(referenceLookup, references, x.definition, updatedOwnerList));
    } else if (IsArrayExpression(expression)) {
      this.findReferences(referenceLookup, references, expression.elements, updatedOwnerList);
    } else if (IsUnionExpression(expression)) {
      expression.elements.forEach(x => this.findReferences(referenceLookup, references, x, updatedOwnerList));
    } else if (IsCompositeExpression(expression)) {
      expression.elements.forEach(x => this.findReferences(referenceLookup, references, x, updatedOwnerList));
    } else if (IsOmitExpression(expression)) {
      this.findReferences(referenceLookup, references, expression.elements, updatedOwnerList);
    } else if (IsMediaExpression(expression)) {
      this.findReferences(referenceLookup, references, expression.body, updatedOwnerList);
    } else if (IsRequestExpression(expression)) {
      (expression.bodies ?? []).forEach(x => this.findReferences(referenceLookup, references, x, updatedOwnerList));
      this.findReferences(referenceLookup, references, expression.pathParameters, updatedOwnerList);
      this.findReferences(referenceLookup, references, expression.cookieParameters, updatedOwnerList);
      this.findReferences(referenceLookup, references, expression.headerParameters, updatedOwnerList);
      this.findReferences(referenceLookup, references, expression.queryParameters, updatedOwnerList);
    } else if (IsResponseExpression(expression)) {
      this.findReferences(referenceLookup, references, expression.headers, updatedOwnerList);
      (expression.responses ?? []).forEach(x => this.findReferences(referenceLookup, references, x, updatedOwnerList));
    } else {
      this._logger.error("shouldn't get here");
    }
  }

  removeUnreferencedModels(astDocument: AstDocument): void {
    const references = new Map<string, string[]>();

    const referenceLookup = new Map<string, string>();

    astDocument.models.filter(IsModelDeclaration).forEach(m => referenceLookup.set(m.referenceName ?? m.id.name, m.astId));
    astDocument.responses.filter(IsModelDeclaration).forEach(m => referenceLookup.set(m.referenceName ?? m.id.name, m.astId));
    astDocument.requests.filter(IsModelDeclaration).forEach(m => referenceLookup.set(m.referenceName ?? m.id.name, m.astId));
    astDocument.pathParameters.filter(IsModelDeclaration).forEach(m => referenceLookup.set(m.referenceName ?? m.id.name, m.astId));
    astDocument.headerParameters.filter(IsModelDeclaration).forEach(m => referenceLookup.set(m.referenceName ?? m.id.name, m.astId));
    astDocument.queryParameters.filter(IsModelDeclaration).forEach(m => referenceLookup.set(m.referenceName ?? m.id.name, m.astId));
    astDocument.cookieParameters.filter(IsModelDeclaration).forEach(m => referenceLookup.set(m.referenceName ?? m.id.name, m.astId));
    astDocument.referenceParameters.filter(IsModelDeclaration).forEach(m => referenceLookup.set(m.referenceName ?? m.id.name, m.astId));

    astDocument.models.forEach(x => this.findReferences(referenceLookup, references, x.definition, [x.astId]));
    astDocument.responses.forEach(x => this.findReferences(referenceLookup, references, x.definition, [x.astId]));
    astDocument.requests.forEach(x => this.findReferences(referenceLookup, references, x.definition, [x.astId]));
    astDocument.pathParameters.forEach(x => this.findReferences(referenceLookup, references, x.definition, [x.astId]));
    astDocument.headerParameters.forEach(x => this.findReferences(referenceLookup, references, x.definition, [x.astId]));
    astDocument.queryParameters.forEach(x => this.findReferences(referenceLookup, references, x.definition, [x.astId]));
    astDocument.cookieParameters.forEach(x => this.findReferences(referenceLookup, references, x.definition, [x.astId]));
    astDocument.referenceParameters.forEach(x => this.findReferences(referenceLookup, references, x.definition, [x.astId]));

    for (const operation of astDocument.operations) {
      references.set(operation.astId, [operation.astId]); // reference self so it doesn't get culled
      for (const responseExp of operation.responses ?? []) {
        this.findReferences(referenceLookup, references, responseExp, [operation.astId]);
      }
      this.findReferences(referenceLookup, references, operation.requests, [operation.astId]);
    }

    // loop until we have removed all unreferenced models
    let didRemove = true;
    while (didRemove) {
      didRemove = false;
      const keepIds = new Set(references.keys());
      for (const key of references.keys()) {
        const refs = references.get(key) ?? [];
        const count = refs.length;
        if (count === 0) {
          references.delete(key);
          didRemove = true;
        } else {
          const keep = refs.filter(x => keepIds.has(x));
          didRemove = didRemove || count !== keep.length;
          if (didRemove) {
            references.set(key, keep);
            if (keep.length === 0) {
              references.delete(key);
            }
          }
        }
      }
    }

    const toKeep = new Set(references.keys());

    astDocument.models = astDocument.models.filter(x => toKeep.has(x.astId));
    astDocument.responses = astDocument.responses.filter(x => toKeep.has(x.astId));
    astDocument.requests = astDocument.requests.filter(x => toKeep.has(x.astId));
    astDocument.pathParameters = astDocument.pathParameters.filter(x => toKeep.has(x.astId));
    astDocument.headerParameters = astDocument.headerParameters.filter(x => toKeep.has(x.astId));
    astDocument.queryParameters = astDocument.queryParameters.filter(x => toKeep.has(x.astId));
    astDocument.cookieParameters = astDocument.cookieParameters.filter(x => toKeep.has(x.astId));
    astDocument.referenceParameters = astDocument.referenceParameters.filter(x => toKeep.has(x.astId));
  }
}
