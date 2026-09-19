import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, the React app runs on :5173 and proxies API/auth calls to the
// Express server on :5000, so cookies and fetches behave the same way they
// will in production (where both are served from one origin).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/login': 'http://localhost:5000',
      '/auth': 'http://localhost:5000',
    },
  },
});
