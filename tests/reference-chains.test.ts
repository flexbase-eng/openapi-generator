import { expect, test } from 'vitest';
import { noopLogger } from '@flexbase/logger';
import fs from 'fs';
import os from 'os';
import Path from 'path';
import { parseSpec } from '../src/parse.js';
import { OpenApiOptimizer } from '../src/optimizer/openapi.optimizer.js';

// Builds a spec where /chain returns Level0, Level0.next -> Level1 -> ... -> Level{depth-1}.
// Every level also has a constrained string property so truncation is visible.
const writeChainSpec = (depth: number, cyclic: boolean): string => {
  const schemas: Record<string, unknown> = {};
  for (let i = 0; i < depth; i++) {
    const properties: Record<string, unknown> = {
      code: { type: 'string', maxLength: 5000, enum: [`level_${i}`] },
    };
    if (i < depth - 1) {
      properties.next = { $ref: `#/components/schemas/Level${i + 1}` };
    } else if (cyclic) {
      properties.next = { $ref: '#/components/schemas/Level0' };
    }
    schemas[`Level${i}`] = { type: 'object', required: ['code'], properties };
  }

  const spec = {
    openapi: '3.0.3',
    info: { title: 'Chain', version: '1.0.0' },
    tags: [{ name: 'chain' }],
    paths: {
      '/chain': {
        get: {
          operationId: 'getChain',
          tags: ['chain'],
          responses: {
            '200': {
              description: 'ok',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Level0' } } },
            },
          },
        },
      },
    },
    components: { schemas },
  };

  const dir = fs.mkdtempSync(Path.join(os.tmpdir(), 'openapi-generator-'));
  const file = Path.join(dir, `chain-${depth}${cyclic ? '-cyclic' : ''}.json`);
  fs.writeFileSync(file, JSON.stringify(spec));
  return file;
};

const expectFullModel = (model: any, level: number, depth: number, cyclic: boolean) => {
  expect(model, `Level${level}`).toBeDefined();
  expect(model.type).toBe('object');
  const code = model.properties.find((p: any) => p.name === 'code');
  expect(code.definition).toMatchObject({ type: 'string', maxLength: 5000, enum: [`level_${level}`] });
  const next = model.properties.find((p: any) => p.name === 'next');
  if (level < depth - 1) {
    expect(next.definition).toMatchObject({ type: 'reference', $ref: `#/components/models/Level${level + 1}` });
  } else if (cyclic) {
    expect(next.definition).toMatchObject({ type: 'reference', $ref: '#/components/models/Level0' });
  } else {
    expect(next).toBeUndefined();
  }
};

test('long reference chains are converted without truncation', async () => {
  const depth = 40;
  const parsedDocument = await parseSpec(writeChainSpec(depth, false), noopLogger);
  const optimized = new OpenApiOptimizer(noopLogger).optimize(parsedDocument);

  const models = optimized.components.models!;
  expect(Object.keys(models)).toHaveLength(depth);
  for (let i = 0; i < depth; i++) {
    expectFullModel(models[`Level${i}`], i, depth, false);
  }
});

test('reference cycles terminate and keep every model intact', async () => {
  const depth = 25;
  const parsedDocument = await parseSpec(writeChainSpec(depth, true), noopLogger);
  const optimized = new OpenApiOptimizer(noopLogger).optimize(parsedDocument);

  const models = optimized.components.models!;
  expect(Object.keys(models)).toHaveLength(depth);
  for (let i = 0; i < depth; i++) {
    expectFullModel(models[`Level${i}`], i, depth, true);
  }
});

test('an optimizer instance can be reused across documents', async () => {
  const optimizer = new OpenApiOptimizer(noopLogger);
  const parsedDocument = await parseSpec(writeChainSpec(5, false), noopLogger);

  const first = optimizer.optimize(parsedDocument);
  const second = optimizer.optimize(parsedDocument);

  expect(Object.keys(second.components.models!)).toHaveLength(5);
  expect(second.components.models).toEqual(first.components.models);
});
