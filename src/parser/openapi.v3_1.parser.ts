import { OpenAPIV3_1 as OpenAPI } from 'openapi-types';
import { OpenApiParser } from './openapi.parser';
import { Logger } from '@flexbase/logger';
import { Component, Components } from './parsed_nodes';

export class OpenApiParser3_1 extends OpenApiParser {
  constructor(logger: Logger) {
    super(logger);
  }

  protected parseComponents(components: OpenAPI.ComponentsObject): Components {
    const { models, requestBodies, responses, parameters, headers, securitySchemes, callbacks } = super.parseComponents(components);

    let pathItems: Component[] = [];

    if (components.pathItems) {
      const records = Object.entries(components.pathItems);
      for (const record of records) {
        const name = record[0];
        const schema = record[1];
        const referenceName = `#/components/pathItems/${name}`;

        const definition = this.parsePathItemObject(schema);
        pathItems.push({ name, referenceName, definition });
      }
    }

    return { models, requestBodies, responses, parameters, headers, securitySchemes, callbacks, pathItems };
  }
}
