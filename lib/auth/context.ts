import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { Brand, Organization, Role } from '@/lib/types'

export type AuthContext = {
  user: { id: string; email: string }
  organization: Organization | null
  role: Role | null
  brands: Brand[]
  activeBrandId: string | null
}

type MembershipRow = {
  organization_id: string
  role: Role
  organizations: { id: string; name: string; plan_tier: string; plan_module: string }
} | null

type BrandRow = { id: string; organization_id: string; name: string; sector: string }

export function mapContext(
  user: { id: string; email: string },
  membership: MembershipRow,
  brandRows: BrandRow[],
  activeBrandId: string | null,
): AuthContext {
  return {
    user,
    organization: membership
      ? {
          id: membership.organizations.id,
          name: membership.organizations.name,
          planTier: membership.organizations.plan_tier as Organization['planTier'],
          planModule: membership.organizations.plan_module as Organization['planModule'],
        }
      : null,
    role: membership?.role ?? null,
    brands: brandRows.map((b) => ({
      id: b.id,
      organizationId: b.organization_id,
      name: b.name,
      sector: b.sector,
    })),
    activeBrandId,
  }
}

export async function getCurrentContext(): Promise<AuthContext | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id, role, organizations(id, name, plan_tier, plan_module)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const brandRows = membership
    ? (
        await supabase
          .from('brands')
          .select('id, organization_id, name, sector')
          .eq('organization_id', membership.organization_id)
      ).data ?? []
    : []

  const cookieStore = await cookies()
  const cookieBrand = cookieStore.get('active_brand_id')?.value ?? null
  const activeBrandId =
    brandRows.find((b) => b.id === cookieBrand)?.id ?? brandRows[0]?.id ?? null

  return mapContext(
    { id: user.id, email: user.email ?? '' },
    membership as MembershipRow,
    brandRows,
    activeBrandId,
  )
}
