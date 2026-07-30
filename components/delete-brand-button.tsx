'use client'

import { deleteBrand } from '@/app/(app)/brands/actions'

export function DeleteBrandButton({ id, name }: { id: string; name: string }) {
  return (
    <form action={deleteBrand}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        data-testid={`delete-brand-${name}`}
        className="text-sm text-red-600"
        onClick={(e) => {
          if (!confirm(`Supprimer la marque ${name} ?`)) e.preventDefault()
        }}
      >
        Supprimer
      </button>
    </form>
  )
}
