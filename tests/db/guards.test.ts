import { expect, test } from 'vitest'
import { serviceClient, createUserClient } from '../helpers/db'

test('impossible de rétrograder le dernier owner', async () => {
  const admin = serviceClient()
  const { userId } = await createUserClient(`owner-${Date.now()}@test.local`)
  const { data: org } = await admin.from('organizations').insert({ name: 'Solo' }).select('id').single()
  const { data: m } = await admin
    .from('memberships')
    .insert({ organization_id: org!.id, user_id: userId, role: 'owner' })
    .select('id').single()

  const { error } = await admin.from('memberships').update({ role: 'member' }).eq('id', m!.id)
  expect(error).not.toBeNull()
})
