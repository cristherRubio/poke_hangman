import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev-time proxy so the browser talks to http://localhost:5173/api/*
// and Vite forwards it to FastAPI on :8000. Avoids CORS entirely in dev.
// In production, point VITE_API_BASE_URL at your deployed API instead
// and drop the proxy (see src/api/client.js).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});