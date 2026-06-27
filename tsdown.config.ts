import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outDir: 'bin',
  clean: true,
  dts: false,
});
