import { expect, test } from 'vitest'
import { mapContext } from '@/lib/auth/context'

test('mapContext assemble org, rôle et marques', () => {
  const ctx = mapContext(
    { id: 'u1', email: 'a@b.c' },
    {
      organization_id: 'o1',
      role: 'admin',
      organizations: { id: 'o1', name: 'Org', plan_tier: 'pme', plan_module: 'bundle' },
    },
    [{ id: 'br1', organization_id: 'o1', name: 'M', sector: 'tech' }],
    'br1',
  )
  expect(ctx.organization?.name).toBe('Org')
  expect(ctx.role).toBe('admin')
  expect(ctx.activeBrandId).toBe('br1')
  expect(ctx.brands[0].sector).toBe('tech')
})
