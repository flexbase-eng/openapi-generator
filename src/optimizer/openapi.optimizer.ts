import { Logger } from '@flexbase/logger';
import { ParsedDocument } from '../parser/parsed.document';
import * as parsed from '../parser/parsed_nodes';
import { OptimizedDocument } from './optimized.document';
import * as optimized from './nodes';
import { Converter } from './converter';

export class OpenApiOptimizer {
  private readonly _converter: Converter;

  constructor(private readonly _logger: Logger) {
    this._converter = new Converter(_logger);
  }

  optimize(document: ParsedDocument): OptimizedDocument {
    const optimizedDocument = this.optimizePaths(document);

    this.optimizeComponents(optimizedDocument.components);

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

    if (parsedParameters.length === 1) {
      const optimizedParameter = this._converter.convertParsedNode(parsedParameters[0], document.components, components);

      if (optimized.isReference(optimizedParameter)) {
        parameter = optimizedParameter;
      } else {
        optimizedParameter.name = name;
        this._converter.addComponent(name, optimizedParameter, components, type);
        parameter = {
          type: 'reference',
          $ref: `#/components/${type}/${name}`,
        };
      }
    } else {
      this._converter.addComponent(name, this.createParameterObject(parsedParameters, document.components, components), components, type);
      parameter = {
        type: 'reference',
        $ref: `#/components/${type}/${name}`,
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
      for (const parameter of operation.parameters) {
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
    let responseReference: optimized.Reference | undefined;

    if (operation.responses) {
      const name = `${operation.operationId}`;
      const referenceName = `#/components/responses/${name}`;

      const response: optimized.Response = { type: 'response', name, responses: [] };
      this._converter.addComponent(name, response, components, 'responses');

      operation.responses.forEach(parsedResponse => {
        const nodeResponse = parsed.isReference(parsedResponse)
          ? this.lookupReference<parsed.Response>(parsedResponse, document.components, 'responses')?.definition
          : parsedResponse;

        if (nodeResponse) {
          nodeResponse.name ??= name;
          const responseObject = this._converter.convertParsedNode(nodeResponse, document.components, components);
          response.responses.push(responseObject as any);
        }
      });

      responseReference = { type: 'reference', $ref: referenceName };
    }

    return responseReference;
  }

  private optimizeOperationRequest(document: ParsedDocument, components: optimized.Components, operation: parsed.Operation) {
    let requestReference: optimized.Reference | undefined;

    if (operation.requestBody) {
      const nodeRequest = parsed.isReference(operation.requestBody)
        ? this.lookupReference<parsed.RequestBody>(operation.requestBody, document.components, 'requests')?.definition
        : operation.requestBody;

      if (nodeRequest) {
        const name = nodeRequest.name ?? `${operation.operationId}`;
        const referenceName = `#/components/requests/${name}`;
        const request = { ...this._converter.convertParsedNode(nodeRequest, document.components, components), name, content: undefined };
        this._converter.addComponent(name, request, components, 'requests');
        requestReference = { type: 'reference', $ref: referenceName };
      }
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

  private compactComposite(composite: optimized.Composite) {
    const mergeNodes: optimized.BaseObjectNode[] = [];
    const otherNodes: optimized.OptimizedNode[] = [];

    for (const node of composite.definitions) {
      if (optimized.isObjectNode(node) || optimized.isParameterObject(node) || optimized.isHeaderObject(node)) {
        mergeNodes.push(node);
      } else {
        otherNodes.push(node);
      }
    }

    const properties: optimized.BaseProperty[] = [];
    mergeNodes.forEach(x => properties.push(...x.properties));
    if (properties.length > 0) {
      otherNodes.push(<optimized.ObjectNode>{ type: 'object', properties });
    }

    return otherNodes.length > 1
      ? <optimized.Composite>{ ...composite, definitions: otherNodes }
      : { ...composite, definitions: undefined, ...otherNodes[0] };
  }

  private optimizeComponentRecord(components: Record<string, optimized.OptimizedNode>): Record<string, optimized.OptimizedNode> {
    const entries = Object.entries(components);
    for (const kvp of entries) {
      const component = kvp[1];
      if (optimized.isComposite(component)) {
        const composite = this.compactComposite(component);
        components[kvp[0]] = composite;
      }
    }

    return components;
  }

  private optimizeComponents(components: optimized.Components) {
    if (components.models) components.models = this.optimizeComponentRecord(components.models);
    if (components.requests) components.requests = this.optimizeComponentRecord(components.requests);
    if (components.requestObjects) components.requestObjects = this.optimizeComponentRecord(components.requestObjects);
    if (components.responses) components.responses = this.optimizeComponentRecord(components.responses);
    if (components.responseObjects) components.responseObjects = this.optimizeComponentRecord(components.responseObjects);
    if (components.parameters) components.parameters = this.optimizeComponentRecord(components.parameters);
    if (components.headers) components.headers = this.optimizeComponentRecord(components.headers);
    if (components.callbacks) components.callbacks = this.optimizeComponentRecord(components.callbacks);
    if (components.pathItems) components.pathItems = this.optimizeComponentRecord(components.pathItems);
    if (components.pathParameters) components.pathParameters = this.optimizeComponentRecord(components.pathParameters);
    if (components.headerParameters) components.headerParameters = this.optimizeComponentRecord(components.headerParameters);
    if (components.queryParameters) components.queryParameters = this.optimizeComponentRecord(components.queryParameters);
    if (components.cookieParameters) components.cookieParameters = this.optimizeComponentRecord(components.cookieParameters);
  }
}
