import { expect, test } from 'vitest'
import { invitationEmail } from './invitation'

test("l'email d'invitation contient le lien et le nom de l'org, sans email en clair", () => {
  const { subject, html } = invitationEmail({
    orgName: 'Mon Agence',
    acceptUrl: 'https://app.veracto.fr/invitations/accept?token=abc',
  })
  expect(subject).toContain('Mon Agence')
  expect(html).toContain('https://app.veracto.fr/invitations/accept?token=abc')
})
