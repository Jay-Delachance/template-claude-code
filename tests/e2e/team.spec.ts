import { expect, test } from '@playwright/test'
import { signUpAndOnboard } from './helpers'

test('un owner peut inviter un membre et voir l\'invitation en attente', async ({ page }) => {
  await signUpAndOnboard(page, { org: 'Team Org', brand: 'B', sector: 'tech' })
  await page.goto('/settings/team')

  await page.getByTestId('invite-email').fill('collegue@test.local')
  await page.getByTestId('invite-role').selectOption('member')
  await page.getByTestId('submit-button').click()

  await expect(page.getByTestId('pending-invitations')).toContainText('collegue@test.local')
})
