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
  // une route publique ne doit pas déclencher de redirection
  expect(res.status).not.toBe(307)
})
