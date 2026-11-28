import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  envDir: '../../',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 1. Monaco Editor (Isolated heavy vendor)
            if (id.includes('@monaco-editor') || id.includes('monaco-editor')) {
              return 'vendor-monaco';
            }
            // 2. Flowchart canvas (Isolated heavy visual graph editor - on-demand)
            if (id.includes('@xyflow') || id.includes('xyflow') || id.includes('d3-')) {
              return 'vendor-flowchart';
            }
            // 3. Icon library
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            // 4. React framework core + Router (grouped cleanly to prevent circular CJS/ESM imports)
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router-dom/') ||
              id.includes('/react-router/') ||
              id.includes('/@remix-run/') ||
              id.includes('/scheduler/') ||
              id.includes('/use-sync-external-store/')
            ) {
              return 'vendor-react-core';
            }
            // 5. Shared API & Auth services
            if (id.includes('axios') || id.includes('zustand') || id.includes('@react-oauth/google')) {
              return 'vendor-services';
            }
          }
        }
      }
    },
    chunkSizeWarningLimit: 600
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
