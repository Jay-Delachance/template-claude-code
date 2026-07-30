'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { completeOnboarding } from './actions'

export default function OnboardingPage() {
  const [state, action] = useActionState(completeOnboarding, null)
  return (
    <main className="mx-auto mt-16 max-w-md space-y-4">
      <h1 className="text-2xl font-bold">Bienvenue sur Veracto</h1>
      <p className="text-sm text-gray-600">Créez votre organisation et votre première marque.</p>
      <form action={action} className="space-y-3">
        <input data-testid="org-name-input" name="orgName" placeholder="Nom de l'organisation"
          className="w-full rounded border p-2" required />
        <input data-testid="brand-name-input" name="brandName" placeholder="Nom de la marque"
          className="w-full rounded border p-2" required />
        <input data-testid="brand-sector-input" name="brandSector" placeholder="Secteur"
          className="w-full rounded border p-2" required />
        {state?.error && <p data-testid="form-error" className="text-sm text-red-600">{state.error}</p>}
        <SubmitButton>Créer mon espace</SubmitButton>
      </form>
    </main>
  )
}
