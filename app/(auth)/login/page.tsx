import { Suspense } from 'react'
import Link from 'next/link'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <main className="mx-auto mt-20 max-w-sm space-y-4">
      <h1 className="text-2xl font-bold">Connexion</h1>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
      <div className="text-sm">
        <Link href="/reset-password" className="underline">Mot de passe oublié ?</Link>
        {' · '}
        <Link href="/signup" className="underline">Créer un compte</Link>
      </div>
    </main>
  )
}
