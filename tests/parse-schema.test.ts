import { assert, expect, test } from 'vitest';
import OpenAPIParser from '@readme/openapi-parser';
import { OpenAPI } from 'openapi-types';
import { IsDocument } from '../src/utilities/openapi.utilities';
import { AbstractSyntaxTreeBuilder } from '../src/ast/ast.builder';
import { AbstractSyntaxTreeConverter } from '../src/ast/ast.converter';
import { NoopLogger } from '@flexbase/logger';

test('petstore schemas', async () => {
  const apiDoc: OpenAPI.Document = await OpenAPIParser.parse('./tests/data/petstore.yaml');

  if (!IsDocument(apiDoc)) {
    assert.fail();
  }

  const astBuilder = new AbstractSyntaxTreeBuilder(new NoopLogger());
  const astConverter = new AbstractSyntaxTreeConverter();

  const ast = astBuilder.generateAst(apiDoc);

  expect(ast.declarations).toHaveLength(3);
  expect(ast.operations).toHaveLength(3);

  const poco = astConverter.convertAstToPoco(ast);

  expect(poco.declarations).toHaveLength(3);
  expect(poco.operations).toHaveLength(3);
});
