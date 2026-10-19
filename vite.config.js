import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// El editor CodeX pinta HTML escrito/importado por el usuario (dangerouslySetInnerHTML)
// en el mismo origen del hub. Sin 'unsafe-inline' no corren onerror=/onclick=/
// javascript: inyectados, que podrían leer la sesión. Solo en build: en dev
// @vitejs/plugin-react inyecta un script inline (React Refresh).
const CSP_EDITOR = "script-src 'self' https://cdn.tailwindcss.com; object-src 'none'; base-uri 'self'"
const cspEditor = {
  name: 'codex-editor-csp',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler(html, ctx) {
      if (!ctx.filename.endsWith('codex-editor.html')) return html
      return html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP_EDITOR}">`)
    },
  },
}

export default defineConfig({
  plugins: [react(), cspEditor],
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
