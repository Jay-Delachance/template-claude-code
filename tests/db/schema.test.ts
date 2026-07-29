import { beforeAll, expect, test } from 'vitest'
import { serviceClient } from '../helpers/db'

test('la table organizations existe avec plan_tier et plan_module', async () => {
  const db = serviceClient()
  const { error } = await db.from('organizations').select('id, name, plan_tier, plan_module').limit(1)
  expect(error).toBeNull()
})

test('la table brands est rattachée à une organisation', async () => {
  const db = serviceClient()
  const { error } = await db.from('brands').select('id, organization_id, name, sector').limit(1)
  expect(error).toBeNull()
})

test('memberships porte un role', async () => {
  const db = serviceClient()
  const { error } = await db.from('memberships').select('id, organization_id, user_id, role').limit(1)
  expect(error).toBeNull()
})
