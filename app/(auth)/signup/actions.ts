'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signUp(_prev: unknown, formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm` },
  })
  if (error) return { error: 'Inscription impossible. Vérifiez vos informations.' }
  if (data.session) redirect('/onboarding')
  return { info: 'Vérifiez vos emails pour confirmer votre compte.' }
}
