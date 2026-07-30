'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { signUp } from './actions'

export default function SignupPage() {
  const [state, action] = useActionState(signUp, null)
  return (
    <main className="mx-auto mt-20 max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Créer un compte</h1>
      <form action={action} className="space-y-3">
        <input data-testid="email" name="email" type="email" placeholder="Email"
          className="w-full rounded border p-2" required />
        <input data-testid="password" name="password" type="password" placeholder="Mot de passe"
          className="w-full rounded border p-2" required minLength={8} />
        {state?.error && <p data-testid="form-error" className="text-sm text-red-600">{state.error}</p>}
        {state?.info && <p data-testid="form-info" className="text-sm text-green-700">{state.info}</p>}
        <SubmitButton>S'inscrire</SubmitButton>
      </form>
      <Link href="/login" className="text-sm underline">Déjà un compte ? Se connecter</Link>
    </main>
  )
}
