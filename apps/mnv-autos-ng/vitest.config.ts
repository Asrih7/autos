/// <reference types='vitest' />
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/archit-versioncero-helvetiang',
  plugins: [angular(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],

  test: {
    name: 'archit-versioncero-helvetiang',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    server: {
      deps: {
        inline: ['@baloise/ds-angular', '@baloise/ds-core', '@stencil/core'],
      },
    },
    reporters: ['default'],

    coverage: {
      provider: 'v8',
      reportsDirectory: '../../coverage/apps/archit-versioncero-helvetiang',
      reporter: ['text', 'lcov', 'json'],   // text: muestra tabla en terminal, lcov: para Sonar
      lines: 1,
      functions: 1,
      branches: 1
    }
  }
}));
