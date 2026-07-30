import { expect, test } from '@playwright/test'

test('un visiteur non connecté est redirigé vers /login', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login/)
})
