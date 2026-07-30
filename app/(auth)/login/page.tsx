'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { signIn, signInWithGoogle } from './actions'

export default function LoginPage() {
  const [state, action] = useActionState(signIn, null)
  return (
    <main className="mx-auto mt-20 max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Connexion</h1>
      <form action={action} className="space-y-3">
        <input data-testid="email" name="email" type="email" placeholder="Email"
          className="w-full rounded border p-2" required />
        <input data-testid="password" name="password" type="password" placeholder="Mot de passe"
          className="w-full rounded border p-2" required />
        {state?.error && (
          <p data-testid="form-error" className="text-sm text-red-600">{state.error}</p>
        )}
        <SubmitButton>Se connecter</SubmitButton>
      </form>
      <form action={signInWithGoogle}>
        <button type="submit" data-testid="google-signin"
          className="w-full rounded border p-2">Continuer avec Google</button>
      </form>
      <div className="text-sm">
        <Link href="/reset-password" className="underline">Mot de passe oublié ?</Link>
        {' · '}
        <Link href="/signup" className="underline">Créer un compte</Link>
      </div>
    </main>
  )
}
