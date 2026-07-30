'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function completeOnboarding(_prev: unknown, formData: FormData) {
  const orgName = String(formData.get('orgName') ?? '').trim()
  const brandName = String(formData.get('brandName') ?? '').trim()
  const brandSector = String(formData.get('brandSector') ?? '').trim()
  if (!orgName || !brandName || !brandSector) {
    return { error: 'Tous les champs sont requis.' }
  }
  const supabase = await createClient()
  const { error } = await supabase.rpc('create_organization_with_brand', {
    org_name: orgName, brand_name: brandName, brand_sector: brandSector,
  })
  if (error) return { error: 'Création impossible, réessayez.' }
  redirect('/dashboard')
}
