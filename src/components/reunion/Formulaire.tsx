'use client'

import { useState } from 'react'
import { DatesPicker } from './DatesPicker'
import { HourRange } from './HourRange'
import { type Reunion } from '@/lib/reunion'

export type Reglages = Pick<Reunion, 'title' | 'dates' | 'earliest' | 'latest' | 'timezone' | 'event_url'>

/** « Quand se réunir ? » — sert à créer un sondage comme à le modifier. */
export function Formulaire({ initial, submitLabel, onSubmit }: {
  initial?: Reglages
  submitLabel: string
  onSubmit: (r: Reglages) => Promise<string | null>
}) {
  const [r, setR] = useState<Reglages>(initial ?? {
    title: '', dates: [], earliest: 9, latest: 22, timezone: 'Europe/Paris', event_url: '',
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function go() {
    if (!r.dates.length) return setErr('Choisissez au moins une date dans le calendrier.')
    setBusy(true); setErr('')
    const e = await onSubmit(r)
    setBusy(false)
    if (e) setErr(e)
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-3xl bg-violet-wash p-5 sm:p-7">
          <h2 className="mb-4 text-center text-[16px] font-medium">Saisir les dates du sondage</h2>
          <DatesPicker value={r.dates} onChange={(dates) => setR({ ...r, dates })} />
          <p className="mt-3 text-center text-[12.5px] text-black/55">
            {r.dates.length ? `${r.dates.length} date${r.dates.length > 1 ? 's' : ''} choisie${r.dates.length > 1 ? 's' : ''}` : 'Touchez les jours, ou glissez pour en prendre plusieurs.'}
          </p>
        </section>
        <section className="rounded-3xl bg-violet-wash p-5 sm:p-7">
          <h2 className="mb-4 text-center text-[16px] font-medium">Saisir les plages horaires du sondage</h2>
          <HourRange from={r.earliest} to={r.latest} onChange={(earliest, latest) => setR({ ...r, earliest, latest })} />
        </section>
      </div>

      <div className="mx-auto mt-8 max-w-3xl space-y-5">
        <div>
          <label className="label text-[15px]" htmlFor="titre">Titre de l&apos;évènement (optionnel)</label>
          <input id="titre" className="field" value={r.title} placeholder="Manifestation pour nos droits"
            onChange={(e) => setR({ ...r, title: e.target.value })} />
        </div>
        <div>
          <label className="label text-[15px]" htmlFor="lien">URL de l&apos;évènement (optionnel)</label>
          <input id="lien" className="field" inputMode="url" value={r.event_url ?? ''} placeholder="Ajouter un titre ici"
            onChange={(e) => setR({ ...r, event_url: e.target.value })} />
        </div>

        {err && <p className="rounded-xl bg-rose px-4 py-3 text-[14px]">{err}</p>}
        <p className="text-center text-[12.5px] text-black/45">Le sondage et ses réponses s&apos;effacent 180 jours après la création.</p>
        <button className="btn-primary w-full rounded-xl" onClick={go} disabled={busy}>{busy ? 'Un instant…' : submitLabel}</button>
      </div>
    </div>
  )
}
