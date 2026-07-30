'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { requestReset } from './actions'

export default function ResetPasswordPage() {
  const [state, action] = useActionState(requestReset, null)
  return (
    <main className="mx-auto mt-20 max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Mot de passe oublié</h1>
      <form action={action} className="space-y-3">
        <input data-testid="email" name="email" type="email" placeholder="Email"
          className="w-full rounded border p-2" required />
        {state?.info && <p data-testid="form-info" className="text-sm text-green-700">{state.info}</p>}
        <SubmitButton>Envoyer le lien</SubmitButton>
      </form>
    </main>
  )
}
