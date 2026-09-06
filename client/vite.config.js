// Vite config for the Ascend frontend.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // listen on 0.0.0.0 so hosted previews can reach the app
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    // Send every /api request to the Express server (see server/server.js),
    // so the frontend can simply call relative URLs like /api/tasks.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
