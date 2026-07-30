export function invitationEmail(params: { orgName: string; acceptUrl: string }) {
  const { orgName, acceptUrl } = params
  return {
    subject: `Vous êtes invité à rejoindre ${orgName} sur Veracto`,
    html: `
      <p>Bonjour,</p>
      <p>Vous avez été invité à rejoindre l'organisation <strong>${orgName}</strong> sur Veracto.</p>
      <p><a href="${acceptUrl}">Accepter l'invitation</a></p>
      <p>Ce lien expirera prochainement.</p>
    `,
  }
}
