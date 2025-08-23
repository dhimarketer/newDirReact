import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      // Proxy API requests to Django backend during development
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy media requests to Django backend during development
      '/media': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy analytics requests to Django backend during development
      '/analytics': {
        target: 'http://localhost:8000/api',
        changeOrigin: true,
        secure: false,
      },
      // Proxy phonebook requests to Django backend during development
      '/phonebook': {
        target: 'http://localhost:8000/api',
        changeOrigin: true,
        secure: false,
      },
      // Proxy auth requests to Django backend during development
      '/auth': {
        target: 'http://localhost:8000/api',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
