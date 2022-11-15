import { assert, expect, test } from 'vitest';
import OpenAPIParser from '@readme/openapi-parser';
import { OpenAPI } from 'openapi-types';
import { IsDocument } from '../src/utilities/openapi.utilities';
import { generateAst } from '../src/ast/ast.builder';

test('petstore schemas', async () => {
  const apiDoc: OpenAPI.Document = await OpenAPIParser.parse('./tests/data/petstore.yaml');

  if (!IsDocument(apiDoc)) {
    assert.fail();
  }

  const ast = generateAst(apiDoc);

  expect(ast.declarations).toHaveLength(3);
  expect(ast.operations).toHaveLength(3);
});
