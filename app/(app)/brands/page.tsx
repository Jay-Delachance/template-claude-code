import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentContext } from '@/lib/auth/context'
import { BrandForm } from './brand-form'
import { DeleteBrandButton } from '@/components/delete-brand-button'

export default async function BrandsPage() {
  const ctx = await getCurrentContext()
  if (!ctx?.organization) redirect('/dashboard')

  const supabase = await createClient()
  const { data: brands } = await supabase
    .from('brands')
    .select('id, name, sector')
    .eq('organization_id', ctx.organization.id)
    .order('created_at', { ascending: true })

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Marques</h1>
      <BrandForm />
      <ul data-testid="brands-list" className="space-y-2">
        {(brands ?? []).map((b) => (
          <li key={b.id} className="flex items-center justify-between rounded border p-3">
            <span>
              {b.name} — <span className="text-gray-500">{b.sector}</span>
            </span>
            <DeleteBrandButton id={b.id} name={b.name} />
          </li>
        ))}
      </ul>
    </section>
  )
}
