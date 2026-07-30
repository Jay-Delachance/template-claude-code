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

test('un admin ne peut pas créer un owner, mais peut créer un member', async () => {
  const svc = serviceClient()
  const ts = Date.now()

  // Créer l'utilisateur owner de l'org (pour que l'org soit bien formée)
  const ownerEmail = `owner-esc-${ts}@test.local`
  const { data: ownerAuth } = await svc.auth.admin.createUser({
    email: ownerEmail,
    password: 'Passw0rd!test',
    email_confirm: true,
  })
  const ownerUserId = ownerAuth!.user!.id

  // Créer l'utilisateur admin agissant (client authentifié)
  const adminEmail = `admin-esc-${ts}@test.local`
  const adminUser = await createUserClient(adminEmail)

  // Créer l'utilisateur cible
  const targetEmail = `target-esc-${ts}@test.local`
  const { data: targetAuth } = await svc.auth.admin.createUser({
    email: targetEmail,
    password: 'Passw0rd!test',
    email_confirm: true,
  })
  const targetUserId = targetAuth!.user!.id

  // Seeder l'org via service_role (auth.uid() null → garde inopérant)
  const { data: org } = await svc.from('organizations').insert({ name: `Org-esc-${ts}` }).select('id').single()
  const orgId = org!.id

  // Donner un owner à l'org
  await svc.from('memberships').insert({ organization_id: orgId, user_id: ownerUserId, role: 'owner' })

  // Faire de l'utilisateur admin un admin de l'org (via service_role)
  await svc.from('memberships').insert({ organization_id: orgId, user_id: adminUser.userId, role: 'admin' })

  // ASSERT 1 : un admin ne peut PAS créer un owner → le garde lève une exception
  const { error: escalationError } = await adminUser.client
    .from('memberships')
    .insert({ organization_id: orgId, user_id: targetUserId, role: 'owner' })
  expect(escalationError).not.toBeNull()

  // ASSERT 2 : un admin PEUT créer un member → insertion normale
  const { error: memberError } = await adminUser.client
    .from('memberships')
    .insert({ organization_id: orgId, user_id: targetUserId, role: 'member' })
  expect(memberError).toBeNull()
})
