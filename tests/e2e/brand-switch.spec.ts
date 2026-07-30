import { expect, test } from '@playwright/test'
import { signUpAndOnboard } from './helpers'

test('changer de marque met à jour la marque active du dashboard', async ({ page }) => {
  await signUpAndOnboard(page, { org: 'Switch Org', brand: 'Alpha', sector: 'tech' })
  // Créer une 2e marque
  await page.goto('/brands')
  await page.getByTestId('brand-name-input').fill('Beta')
  await page.getByTestId('brand-sector-input').fill('retail')
  await page.getByTestId('submit-button').click()

  await page.getByTestId('brand-switcher').selectOption({ label: 'Beta' })
  await page.goto('/dashboard')
  await expect(page.getByTestId('active-brand')).toContainText('Beta')
})
