import { defineConfig } from 'vite';

// Three.js is served as native ESM. Disabling Vite's recursive dependency scan
// avoids the scan that triggered the Windows esbuild directory-access failure.
export default defineConfig({
  optimizeDeps: {
    include: [],
    noDiscovery: true,
  },
});
