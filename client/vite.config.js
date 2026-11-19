import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load every variable from client/.env* (not only VITE_-prefixed ones).
  // API_PROXY_TARGET is used here only and is never exposed to browser code.
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.API_PROXY_TARGET || 'http://localhost:5001'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        // The browser calls /api/* on the Vite origin and Vite forwards it to Express,
        // so cookies stay same-origin during development.
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})