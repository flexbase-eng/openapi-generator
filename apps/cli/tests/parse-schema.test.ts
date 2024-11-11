import { expect, test } from 'vitest';
import { noopLogger } from '@flexbase/logger';
import { parseSpec } from '../src/parse.js';
import { OpenApiOptimizer } from '../src/optimizer/openapi.optimizer.js';
import { Organizer } from '../src/parser/organizer.js';

test('petstore schemas', async () => {
  const organizer = new Organizer(noopLogger);
  const compiler = new OpenApiOptimizer(noopLogger);

  const parsedDocument = await parseSpec('./tests/data/petstore.yaml', noopLogger);

  expect(parsedDocument.paths).toHaveLength(13);

  const documents = organizer.organizeByTags(parsedDocument);

  const optimizedDocs = documents.map(doc => compiler.optimize(doc));

  expect(optimizedDocs).toHaveLength(3);
});
