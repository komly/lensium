import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),  tailwindcss(),],
  server: {
    proxy: {
      '/api/appium': {
        target: 'http://localhost:4723',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/appium/, '')
      }
    }
  }
})
