import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/noturnabar/' : '/',
  server: { port: 3490, strictPort: true, host: true }
}))
