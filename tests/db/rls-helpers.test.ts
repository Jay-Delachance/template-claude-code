import { expect, test } from 'vitest'
import { serviceClient, createUserClient } from '../helpers/db'

test('auth_is_member renvoie true pour un membre, false sinon', async () => {
  const admin = serviceClient()
  const { client, userId } = await createUserClient(`helper-${Date.now()}@test.local`)
  const { data: org } = await admin.from('organizations').insert({ name: 'Org H' }).select('id').single()
  await admin.from('memberships').insert({ organization_id: org!.id, user_id: userId, role: 'owner' })

  const inside = await client.rpc('auth_is_member', { org: org!.id })
  expect(inside.data).toBe(true)

  const { data: other } = await admin.from('organizations').insert({ name: 'Org autre' }).select('id').single()
  const outside = await client.rpc('auth_is_member', { org: other!.id })
  expect(outside.data).toBe(false)
})
