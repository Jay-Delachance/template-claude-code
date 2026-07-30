import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(params: { to: string; subject: string; html: string }) {
  try {
    await resend.emails.send({
      from: 'Veracto <noreply@veracto.fr>',
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
    return { ok: true }
  } catch {
    // Échec loggé sans l'adresse ni le contenu (règle secure-logging).
    console.error('échec envoi email transactionnel')
    return { ok: false }
  }
}
