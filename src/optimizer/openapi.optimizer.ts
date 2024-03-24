import { Logger } from '@flexbase/logger';
import { ParsedDocument } from '../parser/parsed.document';
import {
  Component,
  Components,
  ParsedNode,
  Reference,
  isArrayNode,
  isCallback,
  isComposite,
  isExclusion,
  isHeader,
  isLink,
  isMediaContent,
  isMediaType,
  isNamedHeader,
  isNamedLink,
  isObjectNode,
  isOperation,
  isParameter,
  isPathItem,
  isProperty,
  isReference,
  isRequestBody,
  isResponse,
  isResponseBody,
  isUnion,
} from '../parser/parsed_nodes';
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

  organizeByTags(document: ParsedDocument): ParsedDocument[] {
    const documents: ParsedDocument[] = document.tags.map(tag => {
      const doc = {
        title: tag.name,
        apiName: document.apiName,
        description: tag.description,
        version: document.version,
        tags: [tag],
        paths: this.organizePathsByTags(document, tag.name),
        components: {},
      };

      doc.components = this.organizeComponentsByTags(document, doc.paths);

      return doc;
    });

    return documents;
  }

  private lookupReference<T extends ParsedNode = ParsedNode>(node: Reference, components: Components, type: keyof Components) {
    const found = components[type]?.find(x => x.referenceName === node.reference);
    if (!found) {
      this._logger.warn(`Unable to find ${type}: ${node.reference}`);
      return undefined;
    }
    return found as Component<T>;
  }

  private createParameterObject(
    parameters: (parsed.Parameter | parsed.Reference)[],
    parsedComponents: parsed.Components,
    components: optimized.Components,
  ) {
    const definitions: optimized.OptimizedNode[] = [];

    parameters.forEach(p => {
      if (isReference(p)) {
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

  private optimizeOperation(document: ParsedDocument, components: optimized.Components, operation: parsed.Operation): optimized.Operation {
    const response = this.optimizeOperationResponses(document, components, operation);

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
        if (isReference(path.definition)) {
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

  private removeModelDuplicates(models: Component[]): Component[] {
    return models;
  }

  private removeParameterDuplicates(parameters: Component[]): Component[] {
    const dedupped: Component[] = [];

    parameters.forEach(p => {
      const found = dedupped.some(value => value.referenceName === p.referenceName && compareParsedNodes(value.definition, p.definition));
      if (!found) {
        dedupped.push(p);
      }
    });

    return dedupped;
  }

  private organizePathsByTags(document: ParsedDocument, tag: string): parsed.Path[] {
    const paths = document.paths.map(path => {
      const definition = path.definition;

      if (definition === undefined) {
        return undefined;
      }

      if (isReference(definition)) {
        return path;
      }

      const operations = definition.operations;
      if (operations === undefined) {
        return undefined;
      }

      if (operations.some(operation => operation.tags?.includes(tag))) return path;

      return undefined;
    });

    const isPath = (value?: parsed.Path): value is parsed.Path => {
      return value !== undefined;
    };

    return paths.filter<parsed.Path>(isPath);
  }

  private organizeComponentsByTags(originalDocument: ParsedDocument, paths: parsed.Path[]): Components {
    const components: Required<Components> = {
      models: [],
      requests: [],
      responses: [],
      parameters: [],
      headers: [],
      securitySchemes: [],
      callbacks: [],
      pathItems: [],
    };

    paths.forEach(path => {
      const definition = path.definition;

      if (definition === undefined) {
        return;
      }

      this.traverseReferences(originalDocument, components, definition);
    });

    components.models = components.models.sort((a, b) => a.name.localeCompare(b.name));
    components.requests = components.requests.sort((a, b) => a.name.localeCompare(b.name));
    components.responses = components.responses.sort((a, b) => a.name.localeCompare(b.name));
    components.parameters = components.parameters.sort((a, b) => a.name.localeCompare(b.name));
    components.headers = components.headers.sort((a, b) => a.name.localeCompare(b.name));
    components.securitySchemes = components.securitySchemes.sort((a, b) => a.name.localeCompare(b.name));
    components.callbacks = components.callbacks.sort((a, b) => a.name.localeCompare(b.name));
    components.pathItems = components.pathItems.sort((a, b) => a.name.localeCompare(b.name));
    // components.pathParameters = components.pathParameters.sort((a, b) => a.name.localeCompare(b.name));
    // components.headerParameters = components.headerParameters.sort((a, b) => a.name.localeCompare(b.name));
    // components.queryParameters = components.queryParameters.sort((a, b) => a.name.localeCompare(b.name));
    // components.cookieParameters = components.cookieParameters.sort((a, b) => a.name.localeCompare(b.name));

    return components;
  }

  private findInSection<U extends keyof Components>(components: Components, node: Reference, section: U): Component | undefined {
    const comps = components[section];

    if (!comps) {
      return undefined;
    }

    const found = comps.filter(x => x.referenceName === node.reference);
    if (found === undefined || found.length === 0) {
      return undefined;
    } else {
      if (found.length > 1) {
        this._logger.warn(`mulitiple references of ${section} ${node.reference} found, using first instance`);
      }
      return found[0];
    }
  }

  private find(components: Components, node: Reference): { component?: Component; section?: keyof Components } {
    for (let section of Object.keys(components)) {
      const component = this.findInSection(components, node, section as keyof Components);
      if (component) {
        return { component, section: section as keyof Components };
      }
    }
    return {};
  }

  private addIfMissing(component: Component, components: Required<Components>, section: keyof Components) {
    const existingComponents = components[section];
    const found = existingComponents.find(x => x.referenceName === component.referenceName);
    if (!found) {
      existingComponents.push(component);
      return component;
    }
    return undefined;
  }

  private traverseReferences(originalDocument: ParsedDocument, components: Required<Components>, node: ParsedNode) {
    if (isReference(node)) {
      const { component, section } = this.find(originalDocument.components, node);
      if (!component) {
        this._logger.warn(`${node.reference} not found`);
        return;
      }

      const added = this.addIfMissing(component, components, section!);
      if (added) {
        this.traverseReferences(originalDocument, components, added.definition);
      }
    } else if (isPathItem(node)) {
      if (node.parameters) {
        node.parameters.forEach(x => this.traverseReferences(originalDocument, components, x));
      }
      node.operations.forEach(x => this.traverseReferences(originalDocument, components, x));
    } else if (isOperation(node)) {
      if (node.parameters) {
        node.parameters.forEach(x => this.traverseReferences(originalDocument, components, x));
      }
      // if (node.pathParameter) {
      //   this.traverseReferences(originalDocument, components, node.pathParameter);
      // }
      // if (node.headerParameter) {
      //   this.traverseReferences(originalDocument, components, node.headerParameter);
      // }
      // if (node.queryParameter) {
      //   this.traverseReferences(originalDocument, components, node.queryParameter);
      // }
      // if (node.cookieParameter) {
      //   this.traverseReferences(originalDocument, components, node.cookieParameter);
      // }
      if (node.requestBody) {
        this.traverseReferences(originalDocument, components, node.requestBody);
      }
      if (node.responses) {
        node.responses.forEach(x => this.traverseReferences(originalDocument, components, x));
      }
      // if (node.request) {
      //   this.traverseReferences(originalDocument, components, node.request);
      // }
      // if (node.response) {
      //   this.traverseReferences(originalDocument, components, node.response);
      // }
      if (node.callbacks) {
        node.callbacks.forEach(x => this.traverseReferences(originalDocument, components, x));
      }
    } else if (isRequestBody(node) && node.content) {
      node.content.forEach(x => {
        this.traverseReferences(originalDocument, components, x.definition);
      });
    } else if (isMediaContent(node)) {
      this.traverseReferences(originalDocument, components, node.definition);
    } else if (isMediaType(node) && node.definition) {
      this.traverseReferences(originalDocument, components, node.definition);
    } else if (isObjectNode(node)) {
      node.properties.forEach(x => this.traverseReferences(originalDocument, components, x));
    } else if (isProperty(node)) {
      this.traverseReferences(originalDocument, components, node.definition);
    } else if (isResponse(node)) {
      this.traverseReferences(originalDocument, components, node.definition);
    } else if (isResponseBody(node)) {
      if (node.content) {
        node.content.forEach(x => {
          this.traverseReferences(originalDocument, components, x.definition);
        });
      }
      if (node.headers) {
        node.headers.forEach(x => {
          this.traverseReferences(originalDocument, components, x.definition);
        });
      }
      if (node.links) {
        node.links.forEach(x => {
          this.traverseReferences(originalDocument, components, x.definition);
        });
      }
    } else if (isNamedHeader(node)) {
      this.traverseReferences(originalDocument, components, node.definition);
    } else if (isHeader(node)) {
      if (node.definition) {
        this.traverseReferences(originalDocument, components, node.definition);
      }
      if (node.content) {
        node.content.forEach(x => {
          this.traverseReferences(originalDocument, components, x.definition);
        });
      }
    } else if (isCallback(node)) {
      this.traverseReferences(originalDocument, components, node.definition);
    } else if (isArrayNode(node)) {
      this.traverseReferences(originalDocument, components, node.definition);
    } else if (isComposite(node)) {
      node.definitions.forEach(x => {
        this.traverseReferences(originalDocument, components, x);
      });
    } else if (isExclusion(node)) {
      this.traverseReferences(originalDocument, components, node.definition);
    } else if (isNamedLink(node)) {
      this.traverseReferences(originalDocument, components, node.definition);
    } else if (isLink(node)) {
      // TODO
    } else if (isParameter(node)) {
      if (node.definition) {
        this.traverseReferences(originalDocument, components, node.definition);
      }
      if (node.content) {
        node.content.forEach(x => {
          this.traverseReferences(originalDocument, components, x.definition);
        });
      }
    } else if (isUnion(node)) {
      node.definitions.forEach(x => {
        this.traverseReferences(originalDocument, components, x);
      });
    }
  }
}
