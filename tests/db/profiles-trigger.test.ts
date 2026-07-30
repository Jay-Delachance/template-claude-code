import { expect, test } from 'vitest'
import { serviceClient } from '../helpers/db'

test('un profil est créé automatiquement à la création d\'un utilisateur', async () => {
  const db = serviceClient()
  const email = `trigger-${Date.now()}@test.local`
  const { data, error } = await db.auth.admin.createUser({
    email, password: 'Passw0rd!test', email_confirm: true,
  })
  expect(error).toBeNull()
  const { data: profile } = await db.from('profiles').select('id').eq('id', data.user!.id).single()
  expect(profile?.id).toBe(data.user!.id)
})
