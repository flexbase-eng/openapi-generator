import { Logger } from '@flexbase/logger';
import * as parsed from '../parser/parsed_nodes';
import * as optimized from './nodes';

export class Converter {
  constructor(private readonly _logger: Logger) {}

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

  private find(components: parsed.Components, node: parsed.Reference) {
    for (let section of Object.keys(components)) {
      const component = this.findInSection(components, node, section as keyof parsed.Components);
      if (component) {
        return { component, section: section as keyof parsed.Components };
      }
    }
    this._logger.warn(`${node.reference} not found`);
    return undefined;
  }

  addComponent(referenceName: string, definition: optimized.OptimizedNode, components: optimized.Components, type: keyof optimized.Components) {
    components[type] ??= {};
    components[type]![referenceName] = definition;
  }

  convertParsedNode(parsedNode: parsed.ParsedNode, parsedComponents: parsed.Components, components: optimized.Components): optimized.OptimizedNode {
    if (parsed.isReference(parsedNode)) {
      const found = this.find(parsedComponents, parsedNode);
      if (found) {
        this.addComponent(
          found.component.name,
          this.convertParsedNode(found.component.definition, parsedComponents, components),
          components,
          found.section,
        );
      }
      return this.convertReference(parsedNode);
    } else if (parsed.isPrimative(parsedNode)) {
      return this.convertPrimative(parsedNode);
    } else if (parsed.isParameter(parsedNode)) {
      return this.convertParameter(parsedNode, parsedComponents, components);
    } else if (parsed.isResponseBody(parsedNode)) {
      return this.convertResponseObject(parsedNode, parsedComponents, components);
    } else if (parsed.isHeader(parsedNode)) {
      return this.convertHeader(parsedNode, parsedComponents, components);
    } else if (parsed.isMediaType(parsedNode)) {
      return this.convertMediaType(parsedNode, parsedComponents, components);
    } else if (parsed.isObjectNode(parsedNode)) {
      return this.convertObject(parsedNode, parsedComponents, components);
    } else if (parsed.isArrayNode(parsedNode)) {
      return this.convertArray(parsedNode, parsedComponents, components);
    } else if (parsed.isUnion(parsedNode)) {
      return this.convertUnion(parsedNode, parsedComponents, components);
    } else if (parsed.isComposite(parsedNode)) {
      return this.convertComposite(parsedNode, parsedComponents, components);
    } else if (parsed.isExclusion(parsedNode)) {
      return this.convertExclusion(parsedNode, parsedComponents, components);
    } else if (parsed.isRequestBody(parsedNode)) {
      return this.convertRequestBody(parsedNode, parsedComponents, components);
    }

    return {
      type: parsedNode.type,
    };
  }

  private convertReference(parsedNode: parsed.Reference): optimized.Reference {
    return {
      type: 'reference',
      $ref: parsedNode.reference.replace('#/components/schemas/', '#/components/models/'),
      summary: parsedNode.summary,
      description: parsedNode.description,
    };
  }

  private convertPrimative(parsedNode: parsed.Primative): optimized.Primative {
    return {
      ...parsedNode,
    };
  }

  private convertObject(parsedNode: parsed.ObjectNode, parsedComponents: parsed.Components, components: optimized.Components): optimized.ObjectNode {
    return {
      ...parsedNode,
      properties: parsedNode.properties.map(p => ({ ...p, definition: this.convertParsedNode(p.definition, parsedComponents, components) })),
    };
  }

  private convertUnion(parsedNode: parsed.Union, parsedComponents: parsed.Components, components: optimized.Components): optimized.Union {
    return {
      ...parsedNode,
      definitions: parsedNode.definitions.map(p => this.convertParsedNode(p, parsedComponents, components)),
    };
  }

  private convertComposite(parsedNode: parsed.Composite, parsedComponents: parsed.Components, components: optimized.Components): optimized.Composite {
    return {
      ...parsedNode,
      definitions: parsedNode.definitions.map(p => this.convertParsedNode(p, parsedComponents, components)),
    };
  }

  private convertExclusion(parsedNode: parsed.Exclusion, parsedComponents: parsed.Components, components: optimized.Components): optimized.Exclusion {
    return {
      ...parsedNode,
      definition: this.convertParsedNode(parsedNode.definition, parsedComponents, components),
    };
  }

  private convertArray(parsedNode: parsed.ArrayNode, parsedComponents: parsed.Components, components: optimized.Components): optimized.ArrayNode {
    return {
      ...parsedNode,
      definition: this.convertParsedNode(parsedNode.definition, parsedComponents, components),
    };
  }

  private convertParameter(parsedNode: parsed.Parameter, parsedComponents: parsed.Components, components: optimized.Components): optimized.Parameter {
    let definition: optimized.OptimizedNode = { type: 'error' };

    if (parsedNode.definition) {
      definition = this.convertParsedNode(parsedNode.definition, parsedComponents, components);
    } else if (parsedNode.content) {
      definition = this.convertParsedNode(parsedNode.content[0], parsedComponents, components);
    }

    return {
      type: 'parameter',
      name: parsedNode.name,
      description: parsedNode.description,
      required: parsedNode.required,
      deprecated: parsedNode.deprecated,
      allowEmptyValue: parsedNode.allowEmptyValue,
      style: parsedNode.style,
      explode: parsedNode.explode,
      allowReserved: parsedNode.allowReserved,
      extensions: parsedNode.extensions,
      definition,
    };
  }

  private convertResponseObject(
    parsedNode: parsed.ResponseBody,
    parsedComponents: parsed.Components,
    components: optimized.Components,
  ): optimized.ResponseObject {
    const contentType: Record<string, optimized.OptimizedNode> = {};

    let headers: optimized.HeaderObject | undefined;

    if (parsedNode.headers) {
      const properties: optimized.Header[] = [];
      parsedNode.headers?.forEach(header => {
        const headerDefinition = this.convertParsedNode(header.definition, parsedComponents, components);
        properties.push(<optimized.Header>{
          ...headerDefinition,
          name: header.name,
        });
      });
      headers = { type: 'headerObject', properties };
    }

    if (parsedNode.links) {
      this._logger.warn('Response links not supported yet');
    }

    parsedNode.content?.forEach(responseContent => {
      contentType[responseContent.name] = this.convertParsedNode(responseContent.definition, parsedComponents, components);
    });

    return { type: 'responseObject', description: parsedNode.description, headers: headers, 'content-type': contentType };
  }

  private convertRequestBody(
    parsedNode: parsed.RequestBody,
    parsedComponents: parsed.Components,
    components: optimized.Components,
  ): optimized.Request {
    const contentType: Record<string, optimized.OptimizedNode> = {};

    parsedNode.content?.forEach(requestContent => {
      contentType[requestContent.name] = this.convertParsedNode(requestContent.definition, parsedComponents, components);
    });

    return { ...parsedNode, type: 'request', 'content-type': contentType };
  }

  private convertHeader(parsedNode: parsed.Header, parsedComponents: parsed.Components, components: optimized.Components): optimized.Header {
    let definition: optimized.OptimizedNode = { type: 'error' };

    if (parsedNode.definition) {
      definition = this.convertParsedNode(parsedNode.definition, parsedComponents, components);
    } else if (parsedNode.content) {
      definition = this.convertParsedNode(parsedNode.content[0], parsedComponents, components);
    }

    return {
      name: '',
      type: 'header',
      description: parsedNode.description,
      required: parsedNode.required,
      deprecated: parsedNode.deprecated,
      allowEmptyValue: parsedNode.allowEmptyValue,
      style: parsedNode.style,
      explode: parsedNode.explode,
      allowReserved: parsedNode.allowReserved,
      extensions: parsedNode.extensions,
      definition,
    };
  }

  private convertMediaType(parsedNode: parsed.MediaType, parsedComponents: parsed.Components, components: optimized.Components) {
    return parsedNode.definition ? this.convertParsedNode(parsedNode.definition, parsedComponents, components) : { type: 'null' };
  }
}
