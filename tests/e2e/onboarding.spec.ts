import { expect, test } from '@playwright/test'

test('l\'onboarding crée l\'organisation et la première marque', async ({ page }) => {
  const email = `onb-${Date.now()}@test.local`
  await page.goto('/signup')
  await page.getByTestId('email').fill(email)
  await page.getByTestId('password').fill('Passw0rd!test')
  await page.getByTestId('submit-button').click()
  await expect(page).toHaveURL(/\/onboarding/)

  await page.getByTestId('org-name-input').fill('Mon Agence')
  await page.getByTestId('brand-name-input').fill('Client Alpha')
  await page.getByTestId('brand-sector-input').fill('immobilier')
  await page.getByTestId('submit-button').click()

  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByTestId('org-name')).toContainText('Mon Agence')
})
