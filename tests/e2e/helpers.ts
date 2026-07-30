import { type Page, expect } from '@playwright/test'

export async function signUpAndOnboard(
  page: Page,
  opts: { org: string; brand: string; sector: string },
) {
  const email = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@test.local`
  await page.goto('/signup')
  await page.getByTestId('email').fill(email)
  await page.getByTestId('password').fill('Passw0rd!test')
  await page.getByTestId('submit-button').click()
  await expect(page).toHaveURL(/\/onboarding/)
  await page.getByTestId('org-name-input').fill(opts.org)
  await page.getByTestId('brand-name-input').fill(opts.brand)
  await page.getByTestId('brand-sector-input').fill(opts.sector)
  await page.getByTestId('submit-button').click()
  await expect(page).toHaveURL(/\/dashboard/)
  return email
}
