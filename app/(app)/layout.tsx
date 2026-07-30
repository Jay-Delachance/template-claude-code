import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentContext } from '@/lib/auth/context'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCurrentContext()
  if (!ctx) redirect('/login')
  if (!ctx.organization) redirect('/onboarding')

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b p-4">
        <span className="font-bold">Veracto</span>
        <div className="flex items-center gap-6">
          <span data-testid="org-name" className="text-sm text-gray-600">{ctx.organization.name}</span>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" data-testid="nav-dashboard">Dashboard</Link>
            <Link href="/brands" data-testid="nav-brands">Marques</Link>
            <Link href="/settings/team" data-testid="nav-team">Équipe</Link>
            <form action="/logout" method="post">
              <button type="submit" data-testid="logout">Déconnexion</button>
            </form>
          </nav>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
