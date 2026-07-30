'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentContext } from '@/lib/auth/context'
import { sendEmail } from '@/lib/email/resend'
import { invitationEmail } from '@/lib/email/templates/invitation'
import type { Role } from '@/lib/types'

const INVITE_TTL_DAYS = 7

export async function inviteMember(_prev: unknown, formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const role = String(formData.get('role') ?? 'member') as Role
  if (!email) return { error: 'Email requis.' }

  const ctx = await getCurrentContext()
  if (!ctx?.organization) return { error: 'Organisation introuvable.' }

  const token = randomUUID()
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86400_000).toISOString()

  const supabase = await createClient()
  const { error } = await supabase.from('invitations').insert({
    organization_id: ctx.organization.id,
    email,
    role,
    token,
    invited_by: ctx.user.id,
    expires_at: expiresAt,
  })
  if (error) return { error: 'Invitation impossible (droits insuffisants ?).' }

  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invitations/accept?token=${token}`
  const { subject, html } = invitationEmail({ orgName: ctx.organization.name, acceptUrl })
  void sendEmail({ to: email, subject, html }).catch(() => {})

  revalidatePath('/settings/team')
  return { ok: true }
}

export async function changeRole(formData: FormData) {
  const membershipId = String(formData.get('membershipId') ?? '')
  const role = String(formData.get('role') ?? 'member') as Role
  const supabase = await createClient()
  await supabase.from('memberships').update({ role }).eq('id', membershipId)
  revalidatePath('/settings/team')
}

export async function removeMember(formData: FormData) {
  const membershipId = String(formData.get('membershipId') ?? '')
  const supabase = await createClient()
  await supabase.from('memberships').delete().eq('id', membershipId)
  revalidatePath('/settings/team')
}
