'use server'

import { createClient } from '@/lib/supabase/server'

export async function requestReset(_prev: unknown, formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?type=recovery`,
  })
  // Toujours le même message : pas de révélation de l'existence du compte.
  return { info: 'Si un compte existe, un email vient de vous être envoyé.' }
}
