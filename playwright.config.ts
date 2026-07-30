/**
 * Playwright configuration for Veracto E2E tests.
 *
 * Before running, install browsers:
 *   npx playwright install
 *
 * On unsupported OSes (e.g. macOS 12 / older Linux), install Chrome and set:
 *   use: { channel: 'chrome' }
 * instead of relying on the bundled Chromium.
 *
 * webServer: starts `npm run dev` automatically unless CI=true and the server
 * is already up (reuseExistingServer: !process.env.CI).
 * The timeout is extended to 240 s to accommodate cold Next.js starts.
 */
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
})
