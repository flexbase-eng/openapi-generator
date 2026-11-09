// Times OpenApiOptimizer.optimize on a spec and counts schema nodes that came out empty.
// Usage: npx vite-node scripts/benchmark-optimize.ts <spec.(json|yaml)> [runs]
import { noopLogger } from '@flexbase/logger';
import { parseSpec } from '../src/parse.js';
import { OpenApiOptimizer } from '../src/optimizer/openapi.optimizer.js';

const [specPath, runsArg] = process.argv.slice(2);
if (!specPath) {
  console.error('usage: vite-node scripts/benchmark-optimize.ts <spec> [runs]');
  process.exit(1);
}
const runs = Number(runsArg ?? 3);

const parsedDocument = await parseSpec(specPath, noopLogger);

// A model, reference, union, etc. that only has a `type` (and `name`) left is a truncated stub.
const structural = new Set(['object', 'reference', 'composite', 'union', 'xor', 'array', 'exclusion', 'parameter', 'response', 'request']);
const countStubs = (root: unknown): number => {
  let stubs = 0;
  const seen = new Set<unknown>();
  const walk = (node: unknown) => {
    if (node === null || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    const record = node as Record<string, unknown>;
    if (typeof record.type === 'string' && structural.has(record.type)) {
      const keys = Object.keys(record).filter(k => record[k] !== undefined);
      if (keys.every(k => k === 'type' || k === 'name')) stubs++;
    }
    Object.values(record).forEach(walk);
  };
  walk(root);
  return stubs;
};

const times: number[] = [];
let stubs = 0;
for (let i = 0; i < runs; i++) {
  const start = performance.now();
  const optimized = new OpenApiOptimizer(noopLogger).optimize(parsedDocument);
  times.push(performance.now() - start);
  stubs = countStubs(optimized);
}
times.sort((a, b) => a - b);
const median = times[Math.floor(times.length / 2)];
console.log(`${specPath}: optimize median ${median.toFixed(0)} ms over ${runs} runs, truncated stubs: ${stubs}`);
