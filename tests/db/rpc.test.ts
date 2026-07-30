import { expect, test } from 'vitest'
import { serviceClient, createUserClient } from '../helpers/db'

test('create_organization_with_brand crée org, owner et marque', async () => {
  const { client, userId } = await createUserClient(`rpc-${Date.now()}@test.local`)
  const { data: orgId, error } = await client.rpc('create_organization_with_brand', {
    org_name: 'Mon Org', brand_name: 'Ma Marque', brand_sector: 'saas',
  })
  expect(error).toBeNull()
  expect(orgId).toBeTruthy()

  const admin = serviceClient()
  const { data: m } = await admin.from('memberships')
    .select('role').eq('organization_id', orgId).eq('user_id', userId).single()
  expect(m?.role).toBe('owner')
  const { data: brands } = await admin.from('brands').select('name').eq('organization_id', orgId)
  expect(brands!.map((b) => b.name)).toContain('Ma Marque')
})

test('accept_invitation refuse un token expiré', async () => {
  const admin = serviceClient()
  const { client } = await createUserClient(`inv-${Date.now()}@test.local`)
  const { data: org } = await admin.from('organizations').insert({ name: 'Inviteur' }).select('id').single()
  const token = `tok-${Date.now()}`
  await admin.from('invitations').insert({
    organization_id: org!.id, email: 'inv@test.local', role: 'member',
    token, expires_at: new Date(Date.now() - 1000).toISOString(),
  })
  const { error } = await client.rpc('accept_invitation', { invite_token: token })
  expect(error).not.toBeNull()
})
