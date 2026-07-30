import { expect, test } from '@playwright/test'
import { serviceClient, createUserClient } from '../helpers/db'
import { signUpAndOnboard } from './helpers'

test('un token invalide affiche un message d\'invitation invalide', async ({ page }) => {
  // Un utilisateur connecté sans invitation valide
  await signUpAndOnboard(page, { org: 'Acc Org', brand: 'B', sector: 'tech' })
  await page.goto('/invitations/accept?token=inexistant')
  await expect(page.getByTestId('invite-status')).toContainText('invalide')
})
