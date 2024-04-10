import { ParsedDocument } from './parsed.document';
import { Component, Components, Operation, Parameter, Path, Reference, isReference } from './parsed_nodes';
import { Tag } from './parsed_nodes/tag';

export class Globalizer {
  globalize(document: ParsedDocument): ParsedDocument {
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

      if (components.requests) {
        document.components.requests ??= [];
        document.components.requests.push(...components.requests);
        document.components.requests = document.components.requests.sort((a, b) => a.name.localeCompare(b.name));
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
    const pathNameHash = ''; // String(murmurHash(path.name, 42));

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
    components.requests = generatedRequests;
    components.parameters = generatedParameters;

    return { components, tags };
  }

  private globalizeOperationResponses(pathNameHash: string, operation: Operation): Component[] {
    const generated: Component[] = [];

    if (operation.responses !== undefined) {
      const responses = operation.responses.map(response => {
        if (isReference(response) || isReference(response.definition)) {
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

  private globalizeOperationRequests(pathNameHash: string, operation: Operation): Component[] {
    const generated: Component[] = [];

    if (operation.requestBody !== undefined) {
      if (isReference(operation.requestBody) || operation.requestBody.content === undefined) {
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

  private globalizeParameters(pathNameHash: string, generated: Component[], parameters?: (Parameter | Reference)[]) {
    if (parameters !== undefined) {
      const newParameters = parameters.map(parameter => {
        if (isReference(parameter)) {
          return parameter;
        }

        // make a global parameter
        const name = `generated-${parameter.name}`;
        const referenceName = `#/components/parameters/${name}`;
        generated.push({ name, referenceName, generated: true, definition: parameter });

        return <Reference>{ type: 'reference', reference: referenceName };
      });

      return newParameters;
    }
  }

  private globalizeOperationParameters(pathNameHash: string, operation: Operation): Component[] {
    const generated: Component[] = [];

    // operation.pathParameters = this.globalizeParameters(pathNameHash, generated, operation.pathParameters);
    // operation.queryParameters = this.globalizeParameters(pathNameHash, generated, operation.queryParameters);
    // operation.headerParameters = this.globalizeParameters(pathNameHash, generated, operation.headerParameters);
    // operation.cookieParameters = this.globalizeParameters(pathNameHash, generated, operation.cookieParameters);

    if (operation.parameters !== undefined) {
      const parameters = operation.parameters.map(parameter => {
        if (isReference(parameter)) {
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

  private globalizePathItemParameters(): Component[] {
    const generated: Component[] = [];

    // pathItem.pathParameters = this.globalizeParameters(pathNameHash, generated, pathItem.pathParameters);
    // pathItem.queryParameters = this.globalizeParameters(pathNameHash, generated, pathItem.queryParameters);
    // pathItem.headerParameters = this.globalizeParameters(pathNameHash, generated, pathItem.headerParameters);
    // pathItem.cookieParameters = this.globalizeParameters(pathNameHash, generated, pathItem.cookieParameters);

    // if (pathItem.parameters !== undefined) {
    //   const parameters = pathItem.parameters.map(parameter => {
    //     if (isReference(parameter)) {
    //       return parameter;
    //     }

    //     // make a global parameter
    //     const name = `generated-${parameter.name}`;
    //     const referenceName = `#/components/parameters/${name}`;
    //     generated.push({ name, referenceName, generated: true, definition: parameter });

    //     return <Reference>{ type: 'reference', reference: referenceName };
    //   });

    //   pathItem.parameters = parameters;
    // }

    return generated;
  }
}
