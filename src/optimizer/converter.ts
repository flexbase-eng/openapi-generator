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
    }

    return {
      type: parsedNode.type,
    };
  }

  private convertReference(parsedNode: parsed.Reference): optimized.Reference {
    return {
      type: 'reference',
      $ref: parsedNode.reference,
      summary: parsedNode.summary,
      description: parsedNode.description,
    };
  }

  private convertPrimative(parsedNode: parsed.Primative): optimized.Primative {
    return {
      ...parsedNode,
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
}
