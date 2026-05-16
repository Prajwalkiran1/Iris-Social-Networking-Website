import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Port 3000 + /api proxy keep parity with the old CRA setup so the backend
// CORS allowlist (localhost:3000) and the services' "/api/..." paths work.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
})
