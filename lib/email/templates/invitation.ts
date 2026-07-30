function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function invitationEmail(params: { orgName: string; acceptUrl: string }) {
  const { orgName, acceptUrl } = params
  const safeOrgName = escapeHtml(orgName)
  return {
    subject: `Vous êtes invité à rejoindre ${orgName} sur Veracto`,
    html: `
      <p>Bonjour,</p>
      <p>Vous avez été invité à rejoindre l'organisation <strong>${safeOrgName}</strong> sur Veracto.</p>
      <p><a href="${acceptUrl}">Accepter l'invitation</a></p>
      <p>Ce lien expirera prochainement.</p>
    `,
  }
}
