import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
    include: [
      'tests/**/*.test.{ts,tsx}',
      'app/**/*.test.{ts,tsx}',
      'lib/**/*.test.{ts,tsx}',
      'components/**/*.test.{ts,tsx}',
    ],
    exclude: ['tests/e2e/**'],
    setupFiles: ['./tests/setup.ts'],
  },
})
