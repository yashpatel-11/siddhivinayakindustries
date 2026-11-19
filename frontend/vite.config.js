import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 5173
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-v2-[hash].js`,
        chunkFileNames: `assets/[name]-v2-[hash].js`,
        assetFileNames: `assets/[name]-v2-[hash].[ext]`
      }
    }
  }
})
