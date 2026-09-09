import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    environment: 'node',
    setupFiles: ['src/core/testing/setup.ts'],
    globals: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/core/testing/**', 'src/main.ts']
    }
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
      src: new URL('./src', import.meta.url).pathname
    }
  },
  plugins: [swc.vite({ module: { type: 'es6' } })]
})
