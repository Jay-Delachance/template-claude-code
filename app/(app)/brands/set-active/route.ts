import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const form = await request.formData()
  const brandId = String(form.get('brandId') ?? '')
  const res = NextResponse.redirect(new URL(request.headers.get('referer') ?? '/dashboard', request.url))
  res.cookies.set('active_brand_id', brandId, { path: '/', httpOnly: false, sameSite: 'lax' })
  return res
}
