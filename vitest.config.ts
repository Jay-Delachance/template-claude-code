import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'app/**/*.test.ts', 'lib/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    setupFiles: ['./node_modules/dotenv/config.js'],
  },
})
