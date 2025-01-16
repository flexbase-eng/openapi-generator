import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,

    include: ['./tests/**/*.test.ts'],
    //setupFiles: './tests/setup.ts',
    environment: 'node',
    testTimeout: 50000,
    hookTimeout: 30000,
    fileParallelism: true,
    passWithNoTests: true,
    coverage: {
      reporter: ['lcov'],
    },
  },
});
