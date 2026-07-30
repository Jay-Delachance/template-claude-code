'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signIn(_prev: unknown, formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    // Message générique : pas d'énumération de comptes, pas de log d'email.
    return { error: 'Email ou mot de passe incorrect.' }
  }
  redirect('/dashboard')
}
