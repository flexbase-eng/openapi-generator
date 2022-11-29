import { assert, expect, test } from 'vitest';
import OpenAPIParser from '@readme/openapi-parser';
import { OpenAPI } from 'openapi-types';
import { IsDocument } from '../src/utilities/openapi.utilities';
import { OpenApiSpecBuilder } from '../src/oas-tree/oas.builder';
import { OpenApiSpecConverter } from '../src/oas-tree/oas.converter';
import { NoopLogger } from '@flexbase/logger';

test('petstore schemas', async () => {
  const apiDoc: OpenAPI.Document = await OpenAPIParser.parse('./tests/data/petstore.yaml');

  if (!IsDocument(apiDoc)) {
    assert.fail();
  }

  const oasBuilder = new OpenApiSpecBuilder(new NoopLogger());
  const oasConverter = new OpenApiSpecConverter();

  const oasTree = oasBuilder.generateOasTree(apiDoc);

  expect(oasTree.declarations).toHaveLength(3);
  expect(oasTree.operations).toHaveLength(3);

  const poco = oasConverter.convertOasToPoco(oasTree);

  expect(poco.declarations).toHaveLength(3);
  expect(poco.operations).toHaveLength(3);
});
