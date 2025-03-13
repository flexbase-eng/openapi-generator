import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  "./apps/cli/vitest.config.ts",
  "./apps/flex-openapi/vite.config.ts",
  "./packages/optimizer/vitest.config.ts",
  "./packages/parser/vitest.config.ts"
])
