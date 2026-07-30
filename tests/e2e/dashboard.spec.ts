import { expect, test } from '@playwright/test'
import { signUpAndOnboard } from './helpers'

test('le dashboard affiche la marque active', async ({ page }) => {
  await signUpAndOnboard(page, { org: 'Dash Org', brand: 'Dash Brand', sector: 'tech' })
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByTestId('active-brand')).toContainText('Dash Brand')
})
