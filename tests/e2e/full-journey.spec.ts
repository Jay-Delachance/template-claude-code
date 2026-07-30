/**
 * Parcours E2E complet :
 *   inscription → onboarding → invitation d'un membre → création d'une marque
 *   → vérification en base que l'invitation existe.
 *
 * Ce test est commité mais nécessite un navigateur pour s'exécuter.
 * Lancez-le localement avec : npm run test:e2e -- full-journey
 */
import { expect, test } from '@playwright/test'
import { serviceClient } from '../helpers/db'
import { signUpAndOnboard } from './helpers'

test('parcours complet : inscription → onboarding → invitation → marque', async ({ page }) => {
  await signUpAndOnboard(page, { org: 'Journey Org', brand: 'Alpha', sector: 'tech' })

  // Inviter un membre
  await page.goto('/settings/team')
  await page.getByTestId('invite-email').fill('journey-invite@test.local')
  await page.getByTestId('invite-role').selectOption('member')
  await page.getByTestId('submit-button').click()
  await expect(page.getByTestId('pending-invitations')).toContainText('journey-invite@test.local')

  // Créer une marque supplémentaire
  await page.goto('/brands')
  await page.getByTestId('brand-name-input').fill('Beta')
  await page.getByTestId('brand-sector-input').fill('retail')
  await page.getByTestId('submit-button').click()
  await expect(page.getByTestId('brands-list')).toContainText('Beta')

  // Vérifier en base que l'invitation existe
  const db = serviceClient()
  const { data } = await db
    .from('invitations')
    .select('email')
    .eq('email', 'journey-invite@test.local')
  expect(data!.length).toBeGreaterThan(0)
})
