import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve as pathResolve } from 'node:path';

// ESM-safe __dirname so this config is portable to both node resolvers.
const __dirname = dirname(fileURLToPath(import.meta.url));

// Dev: Vite on :5173, API + static assets (images/, fonts/) proxied to
// the Node server on :8765. Prod: `vite build` → dist/, served by server.js.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': pathResolve(__dirname, 'src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api':    { target: 'http://localhost:8765', changeOrigin: true },
      '/images': { target: 'http://localhost:8765', changeOrigin: true },
      '/fonts':  { target: 'http://localhost:8765', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  css: {
    modules: {
      // Keep class names legible in devtools.
      generateScopedName: '[name]__[local]__[hash:base64:5]',
    },
  },
});
