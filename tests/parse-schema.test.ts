import { expect, test } from 'vitest';
import { noopLogger } from '@flexbase/logger';
import { parseSpec } from '../src/parse';
import { OpenApiOptimizer } from '../src/optimizer/openapi.optimizer';
import { Organizer } from '../src/parser/organizer';

test('petstore schemas', async () => {
  const organizer = new Organizer(noopLogger);
  const compiler = new OpenApiOptimizer(noopLogger);

  const parsedDocument = await parseSpec('./tests/data/petstore.yaml', noopLogger);

  expect(parsedDocument.paths).toHaveLength(15);

  const documents = organizer.organizeByTags(parsedDocument);

  const optimizedDocs = documents.map(doc => compiler.optimize(doc));

  expect(optimizedDocs).toHaveLength(3);
});
