import { ParsedDocument } from './parsed.document.js';
import * as parsed from '../parser/parsed_nodes/index.js';
import { Logger } from '@flexbase/logger';

export class Organizer {
  constructor(private readonly _logger: Logger) {}

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

  private organizePathsByTags(document: ParsedDocument, tag: string): parsed.Path[] {
    const paths = document.paths.map(path => {
      const definition = path.definition;

      if (definition === undefined) {
        return undefined;
      }

      if (parsed.isReference(definition)) {
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

  private organizeComponentsByTags(originalDocument: ParsedDocument, paths: parsed.Path[]): parsed.Components {
    const components: Required<parsed.Components> = {
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

    return components;
  }

  private traverseReferences(originalDocument: ParsedDocument, components: Required<parsed.Components>, node: parsed.ParsedNode) {
    if (parsed.isReference(node)) {
      const { component, section } = this.find(originalDocument.components, node);
      if (!component) {
        this._logger.warn(`${node.reference} not found`);
        return;
      }

      const added = this.addIfMissing(component, components, section!);
      if (added) {
        this.traverseReferences(originalDocument, components, added.definition);
      }
    } else if (parsed.isPathItem(node)) {
      // if (node.parameters) {
      //   node.parameters.forEach(x => this.traverseReferences(originalDocument, components, x));
      // }
      node.operations.forEach(x => this.traverseReferences(originalDocument, components, x));
    } else if (parsed.isOperation(node)) {
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
    } else if (parsed.isRequestBody(node) && node.content) {
      node.content.forEach(x => {
        this.traverseReferences(originalDocument, components, x.definition);
      });
    } else if (parsed.isMediaContent(node)) {
      this.traverseReferences(originalDocument, components, node.definition);
    } else if (parsed.isMediaType(node) && node.definition) {
      this.traverseReferences(originalDocument, components, node.definition);
    } else if (parsed.isObjectNode(node)) {
      node.properties.forEach(x => this.traverseReferences(originalDocument, components, x));
      if (node.additionalProperty) {
        this.traverseReferences(originalDocument, components, node.additionalProperty);
      }
    } else if (parsed.isProperty(node)) {
      this.traverseReferences(originalDocument, components, node.definition);
    } else if (parsed.isResponse(node)) {
      this.traverseReferences(originalDocument, components, node.definition);
    } else if (parsed.isResponseBody(node)) {
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
    } else if (parsed.isNamedHeader(node)) {
      this.traverseReferences(originalDocument, components, node.definition);
    } else if (parsed.isHeader(node)) {
      if (node.definition) {
        this.traverseReferences(originalDocument, components, node.definition);
      }
      if (node.content) {
        node.content.forEach(x => {
          this.traverseReferences(originalDocument, components, x.definition);
        });
      }
    } else if (parsed.isCallback(node)) {
      this.traverseReferences(originalDocument, components, node.definition);
    } else if (parsed.isArrayNode(node)) {
      this.traverseReferences(originalDocument, components, node.definition);
    } else if (parsed.isComposite(node)) {
      node.definitions.forEach(x => {
        this.traverseReferences(originalDocument, components, x);
      });
    } else if (parsed.isExclusion(node)) {
      this.traverseReferences(originalDocument, components, node.definition);
    } else if (parsed.isNamedLink(node)) {
      this.traverseReferences(originalDocument, components, node.definition);
    } else if (parsed.isLink(node)) {
      // TODO
    } else if (parsed.isParameter(node)) {
      if (node.definition) {
        this.traverseReferences(originalDocument, components, node.definition);
      }
      if (node.content) {
        node.content.forEach(x => {
          this.traverseReferences(originalDocument, components, x.definition);
        });
      }
    } else if (parsed.isUnion(node)) {
      node.definitions.forEach(x => {
        this.traverseReferences(originalDocument, components, x);
      });
    } else if (parsed.isXor(node)) {
      node.definitions.forEach(x => {
        this.traverseReferences(originalDocument, components, x);
      });
    }
  }

  private findInSection(components: parsed.Components, node: parsed.Reference, section: keyof parsed.Components): parsed.Component | undefined {
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

  private find(components: parsed.Components, node: parsed.Reference): { component?: parsed.Component; section?: keyof parsed.Components } {
    for (const section of Object.keys(components)) {
      const component = this.findInSection(components, node, section as keyof parsed.Components);
      if (component) {
        return { component, section: section as keyof parsed.Components };
      }
    }
    return {};
  }

  private addIfMissing(component: parsed.Component, components: Required<parsed.Components>, section: keyof parsed.Components) {
    const existingComponents = components[section];
    const found = existingComponents.find(x => x.referenceName === component.referenceName);
    if (!found) {
      existingComponents.push(component);
      return component;
    }
    return undefined;
  }
}
