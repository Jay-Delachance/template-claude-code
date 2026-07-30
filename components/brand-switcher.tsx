'use client'

import type { Brand } from '@/lib/types'

export function BrandSwitcher({ brands, activeId }: { brands: Brand[]; activeId: string | null }) {
  if (brands.length === 0) return null
  return (
    <form action="/brands/set-active" method="post">
      <select
        name="brandId"
        data-testid="brand-switcher"
        defaultValue={activeId ?? undefined}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded border p-1 text-sm"
      >
        {brands.map((b) => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
    </form>
  )
}
