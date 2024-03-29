/// <reference types="vitest" />

import { defineConfig } from 'vite';
import path from 'path';
import typescript from '@rollup/plugin-typescript';
import pkg from './package.json' assert { type: 'json' };
import dts from 'vite-plugin-dts';

const resolvePath = (str: string) => path.resolve(__dirname, str);

export default defineConfig({
  build: {
    target: 'esnext',
    outDir: 'dist',
    lib: {
      entry: resolvePath('./src/index.ts'),
      name: pkg.name,
      fileName: () => `index.js`,
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        banner: '#!/usr/bin/env node',
      },
      plugins: [typescript()],
      external: [...Object.keys(pkg.dependencies || {})],
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'istanbul',
    },
  },
  plugins: [dts({ insertTypesEntry: true })],
});
