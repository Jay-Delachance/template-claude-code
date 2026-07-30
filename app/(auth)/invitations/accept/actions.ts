'use server'

import { createClient } from '@/lib/supabase/server'

export async function acceptInvitation(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'needs-auth' as const }

  const { error } = await supabase.rpc('accept_invitation', { invite_token: token })
  if (error) return { status: 'invalid' as const }
  return { status: 'accepted' as const }
}
