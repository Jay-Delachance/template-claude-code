import { expect, test } from '@playwright/test'

test('la demande affiche toujours un message générique', async ({ page }) => {
  await page.goto('/reset-password')
  await page.getByTestId('email').fill('peuimporte@test.local')
  await page.getByTestId('submit-button').click()
  await expect(page.getByTestId('form-info')).toContainText('email')
})
