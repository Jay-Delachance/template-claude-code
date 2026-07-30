import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Client service_role — SERVEUR UNIQUEMENT. Ne jamais importer côté client.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
