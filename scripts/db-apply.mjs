// Runner de migrations pour Supabase CLOUD via l'API de management (HTTPS).
// Contourne le CLI Supabase (instable ici) : lit supabase/migrations/*.sql
// et exécute chaque fichier via POST /v1/projects/{ref}/database/query.
//
// Usage :
//   node scripts/db-apply.mjs           applique toutes les migrations
//   node scripts/db-apply.mjs --reset   recrée le schéma public puis applique tout
//
// Requiert dans .env.local : SUPABASE_ACCESS_TOKEN (PAT sbp_...) et
// NEXT_PUBLIC_SUPABASE_URL (pour en déduire le project ref).

import { config } from 'dotenv'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

config({ path: '.env.local' })

const token = process.env.SUPABASE_ACCESS_TOKEN
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const ref = url.match(/https:\/\/([^.]+)\./)?.[1]

if (!token || !ref) {
  console.error('✗ SUPABASE_ACCESS_TOKEN ou NEXT_PUBLIC_SUPABASE_URL manquant dans .env.local')
  process.exit(1)
}

const endpoint = `https://api.supabase.com/v1/projects/${ref}/database/query`

async function run(sql, label) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql }),
  })
  const body = await res.text()
  if (!res.ok) {
    console.error(`✗ ${label} → HTTP ${res.status}\n${body.slice(0, 600)}`)
    process.exit(1)
  }
  console.log(`✓ ${label}`)
}

// Recrée public + restaure les grants Supabase par défaut (l'event trigger
// "automatic RLS" du projet réactive la RLS sur chaque nouvelle table).
const RESET_SQL = `
drop schema if exists public cascade;
create schema public;
alter schema public owner to postgres;
grant usage on schema public to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
`

if (process.argv.includes('--reset')) {
  await run(RESET_SQL, 'reset schéma public')
}

const dir = 'supabase/migrations'
const files = existsSync(dir)
  ? readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
  : []

for (const f of files) {
  await run(readFileSync(join(dir, f), 'utf8'), `migration ${f}`)
}

console.log(`\n${files.length} migration(s) appliquée(s) sur le projet ${ref}.`)
