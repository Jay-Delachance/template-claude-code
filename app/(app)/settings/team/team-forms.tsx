'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { inviteMember, changeRole, removeMember } from './actions'

export function InviteForm() {
  const [state, action] = useActionState(inviteMember, null)
  return (
    <form action={action} className="flex gap-2 flex-wrap items-center">
      <input
        data-testid="invite-email"
        name="email"
        type="email"
        placeholder="Email"
        className="rounded border p-2"
        required
      />
      <select
        data-testid="invite-role"
        name="role"
        className="rounded border p-2"
        defaultValue="member"
      >
        <option value="member">Membre</option>
        <option value="admin">Admin</option>
      </select>
      {state?.error && (
        <p data-testid="form-error" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <SubmitButton>Inviter</SubmitButton>
    </form>
  )
}

export function ChangeRoleForm({
  membershipId,
  currentRole,
}: {
  membershipId: string
  currentRole: string
}) {
  return (
    <form action={changeRole}>
      <input type="hidden" name="membershipId" value={membershipId} />
      <select
        name="role"
        defaultValue={currentRole}
        className="rounded border p-1 text-sm"
        onChange={(e) => {
          const form = e.currentTarget.form
          if (form) form.requestSubmit()
        }}
      >
        <option value="member">Membre</option>
        <option value="admin">Admin</option>
        <option value="owner">Owner</option>
      </select>
    </form>
  )
}

export function RemoveMemberButton({
  membershipId,
  displayName,
}: {
  membershipId: string
  displayName: string
}) {
  return (
    <form action={removeMember}>
      <input type="hidden" name="membershipId" value={membershipId} />
      <button
        type="submit"
        className="text-sm text-red-600"
        onClick={(e) => {
          if (!confirm(`Retirer ${displayName} de l'équipe ?`)) e.preventDefault()
        }}
      >
        Retirer
      </button>
    </form>
  )
}
