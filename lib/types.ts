export type Role = 'owner' | 'admin' | 'member'
export type PlanTier = 'independant' | 'pme' | 'agence'
export type PlanModule = 'veille' | 'geo' | 'bundle'

export type Organization = {
  id: string
  name: string
  planTier: PlanTier
  planModule: PlanModule
}

export type Brand = {
  id: string
  organizationId: string
  name: string
  sector: string
}

export type Membership = {
  id: string
  organizationId: string
  userId: string
  role: Role
}

export const MANAGER_ROLES: Role[] = ['owner', 'admin']
