import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000, // Defina aqui a nova porta (ex: 3000)
    proxy: {
      "/api": "http://localhost:3001"
    }
  },
})
