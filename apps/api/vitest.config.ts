import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@project-x/shared-types': path.resolve(__dirname, '../..', 'packages/shared-types/src'),
    },
  },
});
