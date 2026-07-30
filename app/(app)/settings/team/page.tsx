import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentContext } from '@/lib/auth/context'
import { MANAGER_ROLES } from '@/lib/types'
import { InviteForm, ChangeRoleForm, RemoveMemberButton } from './team-forms'

export default async function TeamPage() {
  const ctx = await getCurrentContext()
  if (!ctx?.role || !MANAGER_ROLES.includes(ctx.role)) redirect('/dashboard')

  const supabase = await createClient()
  const { data: members } = await supabase
    .from('memberships')
    .select('id, role, profiles(full_name, id)')
  const { data: invites } = await supabase
    .from('invitations')
    .select('email, role, accepted_at')
    .is('accepted_at', null)

  return (
    <section className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Équipe</h1>

      <InviteForm />

      <div>
        <h2 className="mb-2 font-semibold">Membres</h2>
        <ul data-testid="members-list" className="space-y-1">
          {(members ?? []).map((m) => {
            const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
            const displayName = profile?.full_name ?? m.id
            return (
              <li key={m.id} className="flex items-center gap-3 rounded border p-2 text-sm">
                <span className="flex-1">{displayName}</span>
                <ChangeRoleForm membershipId={m.id} currentRole={m.role} />
                <RemoveMemberButton membershipId={m.id} displayName={displayName} />
              </li>
            )
          })}
        </ul>
      </div>

      <div>
        <h2 className="mb-2 font-semibold">Invitations en attente</h2>
        <ul data-testid="pending-invitations" className="space-y-1">
          {(invites ?? []).map((i) => (
            <li key={i.email} className="rounded border p-2 text-sm">
              {i.email} — {i.role}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
