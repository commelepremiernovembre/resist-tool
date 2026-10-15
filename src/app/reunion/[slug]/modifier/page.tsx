'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Haut } from '@/components/reunion/Haut'
import { Formulaire, type Reglages } from '@/components/reunion/Formulaire'

export default function ModifierSondage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [r, setR] = useState<Reglages | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    fetch(`/api/polls/${params.slug}`, { cache: 'no-store' }).then(async (res) => {
      const b = await res.json()
      res.ok ? setR({ ...b.poll, event_url: b.poll.event_url ?? '' }) : setError(b.error ?? 'Chargement impossible.')
    })
  }, [params.slug])

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-5">
      <Haut />
      <h1 className="mt-12 text-center font-display text-4xl font-extrabold tracking-tight text-violet sm:text-6xl">Modifier le sondage</h1>
      <p className="mx-auto mt-4 max-w-xl text-center text-[14px] text-black/55">
        Les dispos déjà saisies sont gardées. Celles qui tombent hors des nouvelles dates ou heures ne comptent plus, mais reviennent si on remet le créneau.
      </p>
      <div className="mt-10">
        {error && <p className="text-center text-black/60">{error}</p>}
        {!r && !error && <p className="text-center text-black/60">Chargement…</p>}
        {r && (
          <Formulaire
            initial={r}
            submitLabel="Enregistrer les modifications"
            onSubmit={async (next) => {
              const res = await fetch(`/api/polls/${params.slug}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(next) })
              const data = await res.json()
              if (!res.ok) return data.error ?? 'Modification impossible.'
              router.push(`/reunion/${params.slug}`)
              return null
            }}
          />
        )}
      </div>
    </main>
  )
}
