import { Logger } from '@flexbase/logger';
import { ParsedDocument } from '../parser/parsed.document';
import { Component, Components, Operation, Parameter, ParsedNode, Path, PathItem, Reference } from '../parser/parsed_nodes';
import { Tag } from '../parser/parsed_nodes/tag';
import '../utilities/array';

export class OpenApiCompiler {
  constructor(private readonly _logger: Logger) {}

  private isReference(value: ParsedNode): value is Reference {
    return value.type === 'reference';
  }

  private isComponent(value?: Component): value is Component {
    return value !== undefined;
  }

  private isPath(value?: Path): value is Path {
    return value !== undefined;
  }

  optimize(document: ParsedDocument): ParsedDocument {
    document = this.globalize(document);

    document = this.removeDuplicates(document);

    return document;
  }

  organizeByTags(document: ParsedDocument): ParsedDocument[] {
    const documents: ParsedDocument[] = document.tags.map(tag => {
      const doc = {
        title: tag.name,
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

  private globalize(document: ParsedDocument): ParsedDocument {
    const results = document.paths.map(path => {
      return this.globalizePath(path);
    });

    const allTags = document.tags;

    results.forEach(result => {
      const { components, tags } = result;

      allTags.push(...tags);

      if (components.callbacks) {
        document.components.callbacks ??= [];
        document.components.callbacks.push(...components.callbacks);
      }

      if (components.headers) {
        document.components.headers ??= [];
        document.components.headers.push(...components.headers);
      }

      if (components.models) {
        document.components.models ??= [];
        document.components.models.push(...components.models);
      }

      if (components.parameters) {
        document.components.parameters ??= [];
        document.components.parameters.push(...components.parameters);
      }

      if (components.requestBodies) {
        document.components.requestBodies ??= [];
        document.components.requestBodies.push(...components.requestBodies);
      }

      if (components.responses) {
        document.components.responses ??= [];
        document.components.responses.push(...components.responses);
      }
    });

    document.tags = allTags.unique(x => x.name);

    return document;
  }

  private globalizePath(path: Path): { components: Components; tags: Tag[] } {
    const components: Components = {};
    const tags: Tag[] = [];

    if (path.definition === undefined || this.isReference(path.definition)) {
      return { components, tags };
    }

    const pathItem = path.definition;
    const generatedResponses: Component[] = [];
    const generatedRequests: Component[] = [];
    const generatedParameters: Component[] = [];

    generatedParameters.push(...this.globalizePathItemParameters(pathItem));

    for (const operation of pathItem.operations) {
      if (operation.tags) {
        tags.push(...operation.tags.map(tag => ({ type: 'tag', name: tag })));
      }
      generatedResponses.push(...this.globalizeOperationResponses(operation));
      generatedRequests.push(...this.globalizeOperationRequests(operation));
      generatedParameters.push(...this.globalizeOperationParameters(operation));
    }

    components.responses = generatedResponses;
    components.requestBodies = generatedRequests;
    components.parameters = generatedParameters;

    return { components, tags };
  }

  private globalizeOperationResponses(operation: Operation): Component[] {
    let generated: Component[] = [];

    if (operation.responses !== undefined) {
      const responses = operation.responses.map(response => {
        if (this.isReference(response) || this.isReference(response.definition)) {
          return response;
        }

        // make a global response
        const name = `${operation.operationId}-response`;
        const referenceName = `#/components/responses/${name}`;
        generated.push({ name, referenceName, generated: true, definition: response.definition });

        return { ...response, definition: <Reference>{ type: 'reference', reference: referenceName } };
      });

      operation.responses = responses;
    }

    return generated;
  }

  private globalizeOperationRequests(operation: Operation): Component[] {
    let generated: Component[] = [];

    if (operation.requestBody !== undefined) {
      if (this.isReference(operation.requestBody) || operation.requestBody.content === undefined) {
        return generated;
      }

      // make a global request
      const name = `${operation.operationId}-requestBody`;
      const referenceName = `#/components/requestBody/${name}`;
      generated.push({ name, referenceName, generated: true, definition: operation.requestBody });

      operation.requestBody = <Reference>{ type: 'reference', reference: referenceName };
    }

    return generated;
  }

  private globalizeOperationParameters(operation: Operation): Component[] {
    let generated: Component[] = [];

    if (operation.parameters !== undefined) {
      const parameters = operation.parameters.map(parameter => {
        if (this.isReference(parameter)) {
          return parameter;
        }

        // make a global parameter
        const name = `${operation.operationId}-${parameter.name}`;
        const referenceName = `#/components/parameters/${name}`;
        generated.push({ name, referenceName, generated: true, definition: parameter });

        return <Reference>{ type: 'reference', reference: referenceName };
      });

      operation.parameters = parameters;
    }

    return generated;
  }

  private globalizePathItemParameters(pathItem: PathItem): Component[] {
    let generated: Component[] = [];

    if (pathItem.parameters !== undefined) {
      const parameters = pathItem.parameters.map(parameter => {
        if (this.isReference(parameter)) {
          return parameter;
        }

        // make a global parameter
        const name = `generated-${parameter.name}`;
        const referenceName = `#/components/parameters/${name}`;
        generated.push({ name, referenceName, generated: true, definition: parameter });

        return <Reference>{ type: 'reference', reference: referenceName };
      });

      pathItem.parameters = parameters;
    }

    return generated;
  }

  private removeDuplicates(document: ParsedDocument): ParsedDocument {
    if (document.components.models) {
      document.components.models = this.removeModelDuplicates(document.components.models);
    }

    return document;
  }

  private removeModelDuplicates(models: Component[]): Component[] {
    return models;
  }

  private organizePathsByTags(document: ParsedDocument, tag: string): Path[] {
    const paths = document.paths.map(path => {
      const definition = path.definition;

      if (definition === undefined) {
        return undefined;
      }

      if (this.isReference(definition)) {
        return path;
      }

      const operations = definition.operations;
      if (operations === undefined) {
        return undefined;
      }

      if (operations.some(operation => operation.tags?.includes(tag))) return path;

      return undefined;
    });

    return paths.filter<Path>(this.isPath);
  }

  private organizeComponentsByTags(document: ParsedDocument, paths: Path[]): Components {
    const components: Required<Components> = {
      models: [],
      requestBodies: [],
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

      if (this.isReference(definition)) {
        return;
      }

      if (definition.parameters) {
        components.parameters.push(...this.organizeParametersByTags(document, definition.parameters));
      }

      definition.operations.forEach(operation => components.parameters.push(...this.organizeParametersByTags(document, operation.parameters)));
    });

    return components;
  }

  private organizeParametersByTags(document: ParsedDocument, parameters?: (Parameter | Reference)[]): Component[] {
    if (parameters === undefined) {
      return [];
    }

    return parameters
      .map(parameter => {
        if (this.isReference(parameter)) {
          const found = document.components.parameters?.filter(x => x.referenceName === parameter.reference);
          if (found === undefined || found.length === 0) {
            this._logger.warn(`${parameter.reference} not found`);
          } else {
            if (found.length > 1) {
              this._logger.warn(`${parameter.reference} found mulitiple references, using first instance`);
            }
            return found[0];
          }
        }
      })
      .filter<Component>(this.isComponent);
  }
}
