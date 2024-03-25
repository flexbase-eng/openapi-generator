import { Logger } from '@flexbase/logger';
import { ParsedDocument } from '../parser/parsed.document';
import * as parsed from '../parser/parsed_nodes';
import '../utilities/array';
import { compareParsedNodes } from '../parser/compare.parsed.nodes';
import { OptimizedDocument } from './optimized.document';
import * as optimized from './nodes';
import { Converter } from './converter';

export class OpenApiOptimizer {
  private readonly _converter: Converter;

  constructor(private readonly _logger: Logger) {
    this._converter = new Converter(_logger);
  }

  optimize(document: ParsedDocument): OptimizedDocument {
    let optimizedDocument = this.optimizePaths(document);

    document = this.optimizeComposites(document);

    document = this.removeDuplicates(document);

    return optimizedDocument;
  }

  private lookupReference<T extends parsed.ParsedNode = parsed.ParsedNode>(
    node: parsed.Reference,
    components: parsed.Components,
    type: keyof parsed.Components,
  ) {
    const found = components[type]?.find(x => x.referenceName === node.reference);
    if (!found) {
      this._logger.warn(`Unable to find ${type}: ${node.reference}`);
      return undefined;
    }
    return found as parsed.Component<T>;
  }

  private createParameterObject(
    parameters: (parsed.Parameter | parsed.Reference)[],
    parsedComponents: parsed.Components,
    components: optimized.Components,
  ) {
    const definitions: optimized.OptimizedNode[] = [];

    parameters.forEach(p => {
      if (parsed.isReference(p)) {
        const found = this.lookupReference<parsed.Parameter>(p, parsedComponents, 'parameters');
        if (found) {
          definitions.push(<optimized.Reference>{
            type: 'reference',
            $ref: found.referenceName,
          });

          this._converter.addComponent(
            found.name,
            this._converter.convertParsedNode(found.definition, parsedComponents, components),
            components,
            'parameters',
          );
        }
      } else if (p.definition) {
        definitions.push(this._converter.convertParsedNode(p, parsedComponents, components));
      }
    });

    return {
      type: 'composite',
      definitions,
    };
  }

  private optimizeParameters(
    document: ParsedDocument,
    components: optimized.Components,
    parsedParameters: (parsed.Reference | parsed.Parameter)[],
    name: string,
    type: keyof optimized.Components,
  ) {
    let parameter: optimized.Reference;

    const referenceName = `#/components/${type}/${name}`;

    if (parsedParameters.length === 1) {
      const optimizedParameter = this._converter.convertParsedNode(parsedParameters[0], document.components, components);

      if (optimized.isReference(optimizedParameter)) {
        parameter = optimizedParameter;
      } else {
        this._converter.addComponent(name, optimizedParameter, components, type);
        parameter = {
          type: 'reference',
          $ref: referenceName,
        };
      }
    } else {
      this._converter.addComponent(name, this.createParameterObject(parsedParameters, document.components, components), components, type);
      parameter = {
        type: 'reference',
        $ref: referenceName,
      };
    }

    return parameter;
  }

  private optimizeOperationParameters(document: ParsedDocument, components: optimized.Components, operation: parsed.Operation) {
    let pathParams: (parsed.Reference | parsed.Parameter)[] | undefined;
    let headerParams: (parsed.Reference | parsed.Parameter)[] | undefined;
    let queryParams: (parsed.Reference | parsed.Parameter)[] | undefined;
    let cookieParams: (parsed.Reference | parsed.Parameter)[] | undefined;

    if (operation.parameters) {
      for (let i = 0; i < operation.parameters.length; ++i) {
        const parameter = operation.parameters[i];
        const nodeParameter = parsed.isReference(parameter)
          ? this.lookupReference<parsed.Parameter>(parameter, document.components, 'parameters')?.definition
          : parameter;

        switch (nodeParameter?.in) {
          case 'path':
            pathParams ??= [];
            pathParams.push(parameter);
            break;

          case 'header':
            headerParams ??= [];
            headerParams.push(parameter);
            break;

          case 'query':
            queryParams ??= [];
            queryParams.push(parameter);
            break;

          case 'cookie':
            cookieParams ??= [];
            cookieParams.push(parameter);
            break;
        }
      }
    }

    let pathParameter;
    let headerParameter;
    let queryParameter;
    let cookieParameter;

    const name = `${operation.operationId}`;

    if (pathParams) {
      pathParameter = this.optimizeParameters(document, components, pathParams, name, 'pathParameters');
    }
    if (headerParams) {
      headerParameter = this.optimizeParameters(document, components, headerParams, name, 'headerParameters');
    }
    if (queryParams) {
      queryParameter = this.optimizeParameters(document, components, queryParams, name, 'queryParameters');
    }
    if (cookieParams) {
      cookieParameter = this.optimizeParameters(document, components, cookieParams, name, 'cookieParameters');
    }

    return { pathParameter, headerParameter, queryParameter, cookieParameter };
  }

  private optimizeOperationResponses(document: ParsedDocument, components: optimized.Components, operation: parsed.Operation) {
    let responseReference: Record<number, optimized.Reference> | undefined;

    if (operation.responses) {
      const name = `${operation.operationId}`;
      const referenceName = `#/components/responses/${name}`;

      const response: optimized.Response = { type: 'response', name };
      this._converter.addComponent(name, response, components, 'responses');

      operation.responses.forEach(parsedResponse => {
        const nodeResponse = parsed.isReference(parsedResponse)
          ? this.lookupReference<parsed.Response>(parsedResponse, document.components, 'responses')?.definition
          : parsedResponse;

        if (nodeResponse) {
          responseReference ??= {};
          responseReference[Number(nodeResponse.status)] = {
            type: 'reference',
            $ref: `${referenceName}/${nodeResponse.status}`,
          };

          const responseObject = this._converter.convertParsedNode(nodeResponse.definition, document.components, components);

          response[Number(nodeResponse.status)] = responseObject as any;
        }
      });
    }

    return responseReference;
  }

  private optimizeOperationRequest(document: ParsedDocument, components: optimized.Components, operation: parsed.Operation) {
    let requestReference: optimized.Reference | undefined;

    if (operation.requestBody) {
      const name = `${operation.operationId}`;
      const referenceName = `#/components/requests/${name}`;

      const nodeRequest = parsed.isReference(operation.requestBody)
        ? this.lookupReference<parsed.RequestBody>(operation.requestBody, document.components, 'requests')?.definition
        : operation.requestBody;

      if (nodeRequest) {
        const request = { ...this._converter.convertParsedNode(nodeRequest, document.components, components), name, content: undefined };
        this._converter.addComponent(name, request, components, 'requests');
      }

      requestReference = { type: 'reference', $ref: referenceName };
    }

    return requestReference;
  }

  private optimizeOperation(document: ParsedDocument, components: optimized.Components, operation: parsed.Operation): optimized.Operation {
    const response = this.optimizeOperationResponses(document, components, operation);

    const request = this.optimizeOperationRequest(document, components, operation);

    const { pathParameter, headerParameter, queryParameter, cookieParameter } = this.optimizeOperationParameters(document, components, operation);

    return {
      type: 'operation',
      method: operation.method,
      tags: operation.tags,
      description: operation.description,
      summary: operation.summary,
      operationId: operation.operationId,
      deprecated: operation.deprecated,
      //callbacks: operation.callbacks,
      security: operation.security,
      extensions: operation.extensions,
      response,
      request,
      pathParameter,
      headerParameter,
      queryParameter,
      cookieParameter,
    };
  }

  private optimizePathItem(document: ParsedDocument, components: optimized.Components, pathItem: parsed.PathItem) {
    return pathItem.operations.map(op => {
      return this.optimizeOperation(document, components, op);
    });
  }

  private optimizePaths(document: ParsedDocument): OptimizedDocument {
    const components: optimized.Components = {};

    const paths: optimized.Path[] = [];

    document.paths.forEach(path => {
      if (path.definition) {
        if (parsed.isReference(path.definition)) {
          this._logger.warn('Path references not supported');
        } else {
          paths.push({ type: 'path', name: path.name, operations: this.optimizePathItem(document, components, path.definition) });
        }
      }
    });

    return { ...document, paths, components };
  }

  private optimizeComposites(document: ParsedDocument): ParsedDocument {
    // document.paths.forEach(path => {
    //   if (path.definition !== undefined && !isReference(path.definition!)) {
    //     path.definition.operations.forEach(op => {
    //       if (op.requestBody) {
    //         if (isReference(op.requestBody)) {
    //           const found = this.getReferenceComponent(document, op.requestBody.reference);
    //           if(found) {
    //             found.definition remove readonly
    //           }
    //         }
    //       }
    //     });
    //   }
    // });

    return document;
  }

  private removeDuplicates(document: ParsedDocument): ParsedDocument {
    if (document.components.models) {
      document.components.models = this.removeModelDuplicates(document.components.models);
    }

    if (document.components.parameters) {
      document.components.parameters = this.removeParameterDuplicates(document.components.parameters);
    }

    if (document.components.pathItems) {
      document.components.pathItems = this.removeParameterDuplicates(document.components.pathItems);
    }

    return document;
  }

  private removeModelDuplicates(models: parsed.Component[]): parsed.Component[] {
    return models;
  }

  private removeParameterDuplicates(parameters: parsed.Component[]): parsed.Component[] {
    const dedupped: parsed.Component[] = [];

    parameters.forEach(p => {
      const found = dedupped.some(value => value.referenceName === p.referenceName && compareParsedNodes(value.definition, p.definition));
      if (!found) {
        dedupped.push(p);
      }
    });

    return dedupped;
  }
}
