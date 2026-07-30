import { getCurrentContext } from '@/lib/auth/context'

export default async function DashboardPage() {
  const ctx = await getCurrentContext()
  const active = ctx?.brands.find((b) => b.id === ctx.activeBrandId)
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Tableau de bord</h1>
      <p data-testid="active-brand" className="text-gray-600">
        Marque active : {active?.name ?? 'aucune'}
      </p>
      <div className="rounded border border-dashed p-8 text-center text-gray-400">
        Votre veille apparaîtra ici prochainement.
      </div>
    </section>
  )
}
