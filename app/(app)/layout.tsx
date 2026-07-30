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
        <span data-testid="org-name" className="text-sm text-gray-600">{ctx.organization.name}</span>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
