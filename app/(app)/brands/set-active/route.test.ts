import { expect, test } from 'vitest'
import { POST } from './route'

test('set-active pose le cookie active_brand_id et redirige', async () => {
  const form = new FormData()
  form.set('brandId', 'br-123')
  const res = await POST(new Request('http://localhost:3000/brands/set-active', {
    method: 'POST', body: form,
  }))
  expect(res.headers.get('set-cookie')).toContain('active_brand_id=br-123')
})
