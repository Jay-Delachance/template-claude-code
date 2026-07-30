import { expect, test } from '@playwright/test'

test('identifiants invalides affichent une erreur générique', async ({ page }) => {
  await page.goto('/login')
  await page.getByTestId('email').fill('inconnu@test.local')
  await page.getByTestId('password').fill('mauvais')
  await page.getByTestId('submit-button').click()
  await expect(page.getByTestId('form-error')).toContainText('incorrect')
})
