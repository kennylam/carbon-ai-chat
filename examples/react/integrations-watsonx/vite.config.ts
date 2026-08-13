/*
 *  Copyright IBM Corp. 2025, 2026
 *
 *  This source code is licensed under the Apache-2.0 license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // server.js and the browser bundle read the same WATSONX_* names out of
  // .env, so widen the prefix allow-list instead of renaming them to VITE_*.
  envPrefix: ['VITE_', 'WATSONX_'],
  server: {
    port: Number(process.env.PORT) || 3000,
    open: true,
  },
  // @carbon/ai-chat and @carbon/ai-chat-components are symlinked workspace
  // packages. Keeping them out of the dependency pre-bundle means a package
  // rebuild reaches this dev server without a manual optimizer purge.
  optimizeDeps: {
    exclude: ['@carbon/ai-chat', '@carbon/ai-chat-components'],
  },
});
