import { Logger } from '@flexbase/logger';
import { ParsedDocument } from '../parser/parsed.document';
import { Callback, Component, Components, Operation, Parameter, ParsedNode, Path, PathItem, Reference, Response } from '../parser/parsed_nodes';
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

  private isResponse(value: ParsedNode): value is Response {
    return value.type === 'response';
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

  private organizeComponentsByTags(originalDocument: ParsedDocument, paths: Path[]): Components {
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

    const referencedComponents = new Map<string, number>();

    paths.forEach(path => {
      const definition = path.definition;

      if (definition === undefined) {
        return;
      }

      if (this.isReference(definition)) {
        // TODO handle correctly
        return;
      }

      if (definition.parameters) {
        this.organizeXByTags(originalDocument, definition.parameters, components, 'parameters');
      }

      definition.operations.forEach(operation => {
        this.organizeXByTags(originalDocument, operation.parameters, components, 'parameters');
        this.organizeXByTags(originalDocument, operation.callbacks, components, 'callbacks');
        //components.requestBodies.push(...this.organizeXByTags(document, operation.requestBody, 'requestBodies'));
        this.organizeXByTags(originalDocument, operation.responses, components, 'responses');
      });
    });

    return components;
  }

  private organizeXByTags<T extends ParsedNode, U extends keyof Components>(
    originalDocument: ParsedDocument,
    parsedNodes: (T | Reference)[] | undefined,
    components: Required<Components>,
    section: U,
  ) {
    if (parsedNodes === undefined) {
      return;
    }

    const find = (node: Reference) => {
      const comps = originalDocument.components[section];

      const found = comps?.filter(x => x.referenceName === node.reference);
      if (found === undefined || found.length === 0) {
        this._logger.warn(`${section} ${node.reference} not found`);
        return undefined;
      } else {
        if (found.length > 1) {
          this._logger.warn(`mulitiple references of ${section} ${node.reference} found, using first instance`);
        }
        return found[0];
      }
    };

    components[section].push(
      ...parsedNodes
        .map(node => {
          if (this.isReference(node)) {
            return find(node);
          } else if (this.isResponse(node) && this.isReference(node.definition)) {
            return find(node.definition);
          }
        })
        .filter<Component>(this.isComponent),
    );
  }

  private traverseReferences<T extends ParsedNode>(originalDocument: ParsedDocument, node: T, referencedComponents: Map<string, number>) {
    if (this.isReference(node)) {
      const count = (referencedComponents.get(node.reference) ?? 0) + 1;
      referencedComponents.set(node.reference, count);
    }
  }
}
