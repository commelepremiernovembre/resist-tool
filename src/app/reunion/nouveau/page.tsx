'use client'

import { useRouter } from 'next/navigation'
import { Haut } from '@/components/reunion/Haut'
import { Formulaire } from '@/components/reunion/Formulaire'
import { noter } from '@/lib/espace'

export default function NouveauSondage() {
  const router = useRouter()
  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-5">
      <Haut invite={false} />
      <h1 className="mt-12 text-center font-display text-4xl font-extrabold tracking-tight text-violet sm:text-6xl">Quand se réunir ?</h1>
      <div className="mt-10">
        <Formulaire
          submitLabel="Créer un sondage de date"
          onSubmit={async (r) => {
            const res = await fetch('/api/polls', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(r) })
            const data = await res.json()
            if (!res.ok) return data.error ?? 'Création impossible.'
            noter({ type: 'reunion', slug: data.slug, titre: String(r.title ?? '') }, true)
            try { localStorage.setItem('resist:createur:' + data.slug, '1') } catch {} // ses vues ne comptent pas
            router.push(`/reunion/${data.slug}`)
            return null
          }}
        />
      </div>
    </main>
  )
}
