import { redirect } from 'next/navigation'
import Link from 'next/link'
import { acceptInvitation } from './actions'

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  if (!token) {
    return <p data-testid="invite-status" className="p-6">Invitation invalide.</p>
  }

  const result = await acceptInvitation(token)

  if (result.status === 'needs-auth') {
    redirect(`/login?next=${encodeURIComponent(`/invitations/accept?token=${token}`)}`)
  }
  if (result.status === 'accepted') {
    redirect('/dashboard')
  }

  return (
    <main className="mx-auto mt-20 max-w-sm space-y-3 p-6 text-center">
      <p data-testid="invite-status" className="text-red-600">
        Invitation invalide, expirée ou déjà utilisée.
      </p>
      <p className="text-sm text-gray-600">Contactez l&apos;administrateur qui vous a invité.</p>
      <Link href="/dashboard" className="underline">Retour</Link>
    </main>
  )
}
