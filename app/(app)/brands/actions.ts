'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentContext } from '@/lib/auth/context'

export async function createBrand(_prev: unknown, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const sector = String(formData.get('sector') ?? '').trim()
  if (!name || !sector) return { error: 'Nom et secteur requis.' }
  const ctx = await getCurrentContext()
  if (!ctx?.organization) return { error: 'Organisation introuvable.' }

  const supabase = await createClient()
  const { error } = await supabase.from('brands').insert({
    organization_id: ctx.organization.id,
    name,
    sector,
  })
  if (error) return { error: 'Création impossible.' }
  revalidatePath('/brands')
  return { ok: true }
}

export async function deleteBrand(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  const supabase = await createClient()
  await supabase.from('brands').delete().eq('id', id)
  revalidatePath('/brands')
}
