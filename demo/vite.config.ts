/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import react from '@vitejs/plugin-react';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const versionsSource = path.resolve(__dirname, '..', 'versions.js');

/**
 * Serves /versions.js in dev and copies it into dist on build. The version
 * switcher fetches `./versions.js` when running on localhost; the previous
 * bundler copied it into dist with a custom plugin.
 */
function versionsJsPlugin(): Plugin {
  return {
    name: 'demo-versions-js',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url !== '/versions.js') {
          next();
          return;
        }
        try {
          const body = await fs.readFile(versionsSource);
          res.setHeader(
            'Content-Type',
            'application/javascript; charset=utf-8'
          );
          res.end(body);
        } catch (error) {
          next(error);
        }
      });
    },
    async writeBundle(options) {
      const outDir = options.dir ?? path.resolve(__dirname, 'dist');
      try {
        await fs.copyFile(versionsSource, path.join(outDir, 'versions.js'));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn('Failed to copy versions.js:', message);
      }
    },
  };
}

export default defineConfig({
  plugins: [
    // Only transform the demo's own React sources. Prebuilt workspace wrappers
    // under packages/*/es already call react/jsx-runtime; running Refresh over
    // them injects `$RefreshSig$` without loading the runtime.
    react({ include: [/\/demo\/src\/.*\.[jt]sx?$/] }),
    versionsJsPlugin(),
  ],
  // analytics-init.js (and anything else under public/) is served at the site
  // root so the same-origin CSP in tests can pass it under script-src 'self'.
  publicDir: 'public',
  server: {
    port: Number(process.env.PORT) || 3001,
    // Playwright pins PORT=3001; fail rather than silently binding elsewhere.
    strictPort: Boolean(process.env.PORT),
    host: true,
    open: true,
  },
  // @carbon/ai-chat and @carbon/ai-chat-components are symlinked workspace
  // packages. Keeping them out of the dependency pre-bundle means a package
  // rebuild reaches this dev server without a manual optimizer purge.
  optimizeDeps: {
    exclude: ['@carbon/ai-chat', '@carbon/ai-chat-components'],
  },
});
