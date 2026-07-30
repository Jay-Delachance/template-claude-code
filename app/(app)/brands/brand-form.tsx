'use client'

import { useActionState } from 'react'
import { SubmitButton } from '@/components/submit-button'
import { createBrand } from './actions'

export function BrandForm() {
  const [state, action] = useActionState(createBrand, null)
  return (
    <form action={action} className="flex gap-2">
      <input
        data-testid="brand-name-input"
        name="name"
        placeholder="Nom"
        className="rounded border p-2"
        required
      />
      <input
        data-testid="brand-sector-input"
        name="sector"
        placeholder="Secteur"
        className="rounded border p-2"
        required
      />
      {state?.error && (
        <p data-testid="form-error" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <SubmitButton>Ajouter</SubmitButton>
    </form>
  )
}
