import { expect, test } from '@playwright/test'

test('un nouvel utilisateur peut s\'inscrire et arrive sur l\'onboarding', async ({ page }) => {
  const email = `signup-${Date.now()}@test.local`
  await page.goto('/signup')
  await page.getByTestId('email').fill(email)
  await page.getByTestId('password').fill('Passw0rd!test')
  await page.getByTestId('submit-button').click()
  await expect(page).toHaveURL(/\/onboarding/)
})
