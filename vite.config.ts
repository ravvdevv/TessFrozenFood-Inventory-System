import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    base: process.env.NODE_ENV === 'production' ? '/' : '/',
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      chunkSizeWarningLimit: 1600,
    },
    server: {
      port: 3000,
      strictPort: true,
      host: true,
    },
    preview: {
      port: 3000,
      strictPort: true,
    }
  }
})
