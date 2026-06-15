import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/boardgame_prod_calculator/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
})
