import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_URL_BASE

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/users': backendUrl,
        '/courses': backendUrl,
        '/enrollments': backendUrl,
        '/journey': backendUrl,
      }
    }
  }
})