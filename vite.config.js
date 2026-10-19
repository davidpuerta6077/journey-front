import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // codex-editor.html = editor CodeX, que corre en un iframe dentro de /codex/:id.
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        codex: resolve(import.meta.dirname, 'codex-editor.html'),
      },
    },
  },
})
