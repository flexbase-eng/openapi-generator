import { Logger } from '@flexbase/logger';
import { ParsedDocument } from '../parser/parsed.document';
import {
  Component,
  Components,
  Operation,
  ParsedNode,
  Path,
  PathItem,
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
import { Tag } from '../parser/parsed_nodes/tag';
import '../utilities/array';
import { murmurHash } from '../utilities/murmur.hash';
import { compareParsedNodes } from '../parser/compare.parsed.nodes';

export class OpenApiCompiler {
  constructor(private readonly _logger: Logger) {}

  private isPath(value?: Path): value is Path {
    return value !== undefined;
  }

  optimize(document: ParsedDocument): ParsedDocument {
    document.paths = document.paths.sort((a, b) => a.name.localeCompare(b.name));

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
        document.components.callbacks = document.components.callbacks.sort((a, b) => a.name.localeCompare(b.name));
      }

      if (components.headers) {
        document.components.headers ??= [];
        document.components.headers.push(...components.headers);
        document.components.headers = document.components.headers.sort((a, b) => a.name.localeCompare(b.name));
      }

      if (components.models) {
        document.components.models ??= [];
        document.components.models.push(...components.models);
        document.components.models = document.components.models.sort((a, b) => a.name.localeCompare(b.name));
      }

      if (components.parameters) {
        document.components.parameters ??= [];
        document.components.parameters.push(...components.parameters);
        document.components.parameters = document.components.parameters.sort((a, b) => a.name.localeCompare(b.name));
      }

      if (components.requestBodies) {
        document.components.requestBodies ??= [];
        document.components.requestBodies.push(...components.requestBodies);
        document.components.requestBodies = document.components.requestBodies.sort((a, b) => a.name.localeCompare(b.name));
      }

      if (components.responses) {
        document.components.responses ??= [];
        document.components.responses.push(...components.responses);
        document.components.responses = document.components.responses.sort((a, b) => a.name.localeCompare(b.name));
      }

      if (components.pathItems) {
        document.components.pathItems ??= [];
        document.components.pathItems.push(...components.pathItems);
        document.components.pathItems = document.components.pathItems.sort((a, b) => a.name.localeCompare(b.name));
      }

      if (components.securitySchemes) {
        document.components.securitySchemes ??= [];
        document.components.securitySchemes.push(...components.securitySchemes);
        document.components.securitySchemes = document.components.securitySchemes.sort((a, b) => a.name.localeCompare(b.name));
      }
    });

    document.tags = allTags.unique(x => x.name).sort((a, b) => a.name.localeCompare(b.name));

    return document;
  }

  private globalizePath(path: Path): { components: Components; tags: Tag[] } {
    const components: Components = {};
    const tags: Tag[] = [];

    if (path.definition === undefined || isReference(path.definition)) {
      return { components, tags };
    }

    const pathItem = path.definition;
    const generatedResponses: Component[] = [];
    const generatedRequests: Component[] = [];
    const generatedParameters: Component[] = [];
    const pathNameHash = String(murmurHash(path.name, 42));

    generatedParameters.push(...this.globalizePathItemParameters(pathNameHash, pathItem));

    for (const operation of pathItem.operations) {
      if (operation.tags) {
        tags.push(...operation.tags.map(tag => ({ type: 'tag', name: tag })));
      }
      generatedResponses.push(...this.globalizeOperationResponses(pathNameHash, operation));
      generatedRequests.push(...this.globalizeOperationRequests(pathNameHash, operation));
      generatedParameters.push(...this.globalizeOperationParameters(pathNameHash, operation));
    }

    components.responses = generatedResponses;
    components.requestBodies = generatedRequests;
    components.parameters = generatedParameters;

    return { components, tags };
  }

  private globalizeOperationResponses(pathNameHash: string, operation: Operation): Component[] {
    let generated: Component[] = [];

    if (operation.responses !== undefined) {
      const responses = operation.responses.map(response => {
        if (isReference(response) || isReference(response.definition)) {
          return response;
        }

        // make a global response
        const name = `${operation.operationId}-response-${pathNameHash}`;
        const referenceName = `#/components/responses/${name}`;
        generated.push({ name, referenceName, generated: true, definition: response.definition });

        return { ...response, definition: <Reference>{ type: 'reference', reference: referenceName } };
      });

      operation.responses = responses;
    }

    return generated;
  }

  private globalizeOperationRequests(pathNameHash: string, operation: Operation): Component[] {
    let generated: Component[] = [];

    if (operation.requestBody !== undefined) {
      if (isReference(operation.requestBody) || operation.requestBody.content === undefined) {
        return generated;
      }

      // make a global request
      const name = `${operation.operationId}-requestBody-${pathNameHash}`;
      const referenceName = `#/components/requestBody/${name}`;
      generated.push({ name, referenceName, generated: true, definition: operation.requestBody });

      operation.requestBody = <Reference>{ type: 'reference', reference: referenceName };
    }

    return generated;
  }

  private globalizeOperationParameters(pathNameHash: string, operation: Operation): Component[] {
    let generated: Component[] = [];

    if (operation.parameters !== undefined) {
      const parameters = operation.parameters.map(parameter => {
        if (isReference(parameter)) {
          return parameter;
        }

        // make a global parameter
        const name = `${operation.operationId}-${parameter.name}-${pathNameHash}`;
        const referenceName = `#/components/parameters/${name}`;
        generated.push({ name, referenceName, generated: true, definition: parameter });

        return <Reference>{ type: 'reference', reference: referenceName };
      });

      operation.parameters = parameters;
    }

    return generated;
  }

  private globalizePathItemParameters(pathNameHash: string, pathItem: PathItem): Component[] {
    let generated: Component[] = [];

    if (pathItem.parameters !== undefined) {
      const parameters = pathItem.parameters.map(parameter => {
        if (isReference(parameter)) {
          return parameter;
        }

        // make a global parameter
        const name = `generated-${parameter.name}-${pathNameHash}`;
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

  private organizePathsByTags(document: ParsedDocument, tag: string): Path[] {
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

    paths.forEach(path => {
      const definition = path.definition;

      if (definition === undefined) {
        return;
      }

      this.traverseReferences(originalDocument, components, definition);
    });

    components.models = components.models.sort((a, b) => a.name.localeCompare(b.name));
    components.requestBodies = components.requestBodies.sort((a, b) => a.name.localeCompare(b.name));
    components.responses = components.responses.sort((a, b) => a.name.localeCompare(b.name));
    components.parameters = components.parameters.sort((a, b) => a.name.localeCompare(b.name));
    components.headers = components.headers.sort((a, b) => a.name.localeCompare(b.name));
    components.securitySchemes = components.securitySchemes.sort((a, b) => a.name.localeCompare(b.name));
    components.callbacks = components.callbacks.sort((a, b) => a.name.localeCompare(b.name));
    components.pathItems = components.pathItems.sort((a, b) => a.name.localeCompare(b.name));

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
      if (node.requestBody) {
        this.traverseReferences(originalDocument, components, node.requestBody);
      }
      if (node.responses) {
        node.responses.forEach(x => this.traverseReferences(originalDocument, components, x));
      }
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
