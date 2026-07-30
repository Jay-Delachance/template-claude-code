'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { SubmitButton } from '@/components/submit-button'
import { signIn, signInWithGoogle } from './actions'

export function LoginForm() {
  const [state, action] = useActionState(signIn, null)
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? ''
  return (
    <>
      <form action={action} className="space-y-3">
        <input data-testid="email" name="email" type="email" placeholder="Email"
          className="w-full rounded border p-2" required />
        <input data-testid="password" name="password" type="password" placeholder="Mot de passe"
          className="w-full rounded border p-2" required />
        {next && <input type="hidden" name="next" value={next} />}
        {state?.error && (
          <p data-testid="form-error" className="text-sm text-red-600">{state.error}</p>
        )}
        <SubmitButton>Se connecter</SubmitButton>
      </form>
      <form action={signInWithGoogle}>
        <button type="submit" data-testid="google-signin"
          className="w-full rounded border p-2">Continuer avec Google</button>
      </form>
    </>
  )
}
