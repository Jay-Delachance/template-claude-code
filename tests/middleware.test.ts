// @vitest-environment node
import { expect, test } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'

test('un accès non authentifié à /dashboard redirige vers /login', async () => {
  const res = await middleware(new NextRequest('http://localhost:3000/dashboard'))
  expect(res.status).toBe(307)
  expect(res.headers.get('location')).toContain('/login')
})

test("une route publique (/login) n'est pas redirigée", async () => {
  const res = await middleware(new NextRequest('http://localhost:3000/login'))
  // pas de redirection vers /login (déjà public) : soit 200/pass-through, pas un 307 vers /login
  const loc = res.headers.get('location')
  expect(loc === null || !loc.endsWith('/login')).toBe(true)
})
