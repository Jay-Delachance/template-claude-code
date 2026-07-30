import { expect, test } from 'vitest'
import { GET } from './route'

test('callback sans code redirige vers /login avec une erreur', async () => {
  const res = await GET(new Request('http://localhost:3000/auth/callback'))
  expect(res.status).toBe(307)
  expect(res.headers.get('location')).toContain('/login')
})
