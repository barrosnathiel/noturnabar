import { defineConfig } from 'vite'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  build: { target: ['es2020', 'safari14'] },
  server: { port: 3490, strictPort: true, host: true }
}))
