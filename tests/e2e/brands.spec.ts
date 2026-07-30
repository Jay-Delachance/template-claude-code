import { expect, test } from '@playwright/test'
import { signUpAndOnboard } from './helpers'

test('créer puis supprimer une marque', async ({ page }) => {
  await signUpAndOnboard(page, { org: 'Brands Org', brand: 'Première', sector: 'tech' })
  await page.goto('/brands')

  await page.getByTestId('brand-name-input').fill('Deuxième')
  await page.getByTestId('brand-sector-input').fill('sante')
  await page.getByTestId('submit-button').click()
  await expect(page.getByTestId('brands-list')).toContainText('Deuxième')

  page.on('dialog', (d) => d.accept())
  await page.getByTestId('delete-brand-Deuxième').click()
  await expect(page.getByTestId('brands-list')).not.toContainText('Deuxième')
})
