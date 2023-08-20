import { OpenAPIV3 as OpenAPI } from 'openapi-types';
import { OpenApiParser } from './openapi.parser';
import { Component, Components } from './parsed_nodes';

export class OpenApiParser3 extends OpenApiParser {
  parse(document: OpenAPI.Document) {
    const components = document.components ? this.parseComponents(document.components) : {};

    const paths = document.paths ? this.parsePaths(document.paths) : {};

    return { components, paths };
  }

  parseComponents(components: OpenAPI.ComponentsObject): Components {
    const models: Component[] = [];
    const requestBodies: Component[] = [];
    const responses: Component[] = [];
    const parameters: Component[] = [];
    const headers: Component[] = [];
    const securitySchemes: Component[] = [];
    const callbacks: Component[] = [];

    if (components.schemas) {
      const records = Object.entries(components.schemas);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const referenceName = `#/components/schemas/${name}`;

        const definition = this.parseSchema(schema);
        models.push({ name, referenceName, definition });
      }
    }

    if (components.requestBodies) {
      const records = Object.entries(components.requestBodies);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const referenceName = `#/components/requestBodies/${name}`;

        const definition = this.parseRequestBody(schema);
        requestBodies.push({ name, referenceName, definition });
      }
    }

    if (components.responses) {
      const records = Object.entries(components.responses);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const referenceName = `#/components/responses/${name}`;

        const definition = this.parseResponse(schema);
        responses.push({ name, referenceName, definition });
      }
    }

    if (components.parameters) {
      const records = Object.entries(components.parameters);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const referenceName = `#/components/parameters/${name}`;

        const definition = this.parseParameter(schema);
        parameters.push({ name, referenceName, definition });
      }
    }

    if (components.headers) {
      const records = Object.entries(components.headers);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const referenceName = `#/components/headers/${name}`;

        const definition = this.parseHeaderObject(schema);
        headers.push({ name, referenceName, definition });
      }
    }

    if (components.securitySchemes) {
      const records = Object.entries(components.securitySchemes);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const referenceName = `#/components/securitySchemes/${name}`;

        const definition = this.parseSecurityScheme(schema);
        securitySchemes.push({ name, referenceName, definition });
      }
    }

    if (components.callbacks) {
      const records = Object.entries(components.callbacks);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const referenceName = `#/components/callbacks/${name}`;

        const definition = this.parseCallback(schema);
        callbacks.push({ name, referenceName, definition });
      }
    }

    return { models, requestBodies, responses, parameters, headers, securitySchemes, callbacks };
  }
}
