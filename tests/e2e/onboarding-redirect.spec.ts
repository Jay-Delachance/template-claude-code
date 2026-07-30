import { expect, test } from '@playwright/test'

test('un utilisateur connecté sans organisation est envoyé sur /onboarding', async ({ page }) => {
  const email = `noorg-${Date.now()}@test.local`
  await page.goto('/signup')
  await page.getByTestId('email').fill(email)
  await page.getByTestId('password').fill('Passw0rd!test')
  await page.getByTestId('submit-button').click()
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/onboarding/)
})
