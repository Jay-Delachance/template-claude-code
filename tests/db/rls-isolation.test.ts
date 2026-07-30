import { expect, test } from 'vitest'
import { serviceClient, createUserClient } from '../helpers/db'

async function seedOrgWithMember(name: string, email: string) {
  const admin = serviceClient()
  const { client, userId } = await createUserClient(email)
  const { data: org } = await admin.from('organizations').insert({ name }).select('id').single()
  await admin.from('memberships').insert({ organization_id: org!.id, user_id: userId, role: 'owner' })
  await admin.from('brands').insert({ organization_id: org!.id, name: `${name} brand`, sector: 'tech' })
  return { client, orgId: org!.id }
}

test('un membre de l\'org A ne voit pas les marques de l\'org B', async () => {
  const a = await seedOrgWithMember('Org A', `a-${Date.now()}@test.local`)
  const b = await seedOrgWithMember('Org B', `b-${Date.now()}@test.local`)

  const { data: mine } = await a.client.from('brands').select('id, organization_id')
  expect(mine!.every((row) => row.organization_id === a.orgId)).toBe(true)
  expect(mine!.some((row) => row.organization_id === b.orgId)).toBe(false)
})

test('un membre de l\'org A ne peut pas insérer une marque dans l\'org B', async () => {
  const a = await seedOrgWithMember('Org A2', `a2-${Date.now()}@test.local`)
  const b = await seedOrgWithMember('Org B2', `b2-${Date.now()}@test.local`)
  const { error } = await a.client.from('brands').insert({
    organization_id: b.orgId, name: 'pirate', sector: 'x',
  })
  expect(error).not.toBeNull()
})
