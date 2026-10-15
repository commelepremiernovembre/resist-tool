'use client'

import Link from 'next/link'
import { effaceLe } from '@/lib/duree'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Haut } from '@/components/reunion/Haut'
import { Grille } from '@/components/reunion/Grille'
import { noter } from '@/lib/espace'
import {
  best, dayLong, hhmm, nameKey, PREF_LABEL, rangeText, STEP,
  type Dispo, type Pref, type Reunion,
} from '@/lib/reunion'

const PSEUDO = 'resist_pseudo'

// Une vue par visite (onglet) ; celles de l'appareil qui a créé le sondage ne comptent pas.
function compterVue(slug: string) {
  try {
    if (localStorage.getItem('resist:createur:' + slug)) return
    if (sessionStorage.getItem('resist:vu:' + slug)) return
    sessionStorage.setItem('resist:vu:' + slug, '1')
  } catch {}
  fetch(`/api/polls/${slug}/vue`, { method: 'POST' }).catch(() => {})
}

export default function Sondage({ params }: { params: { slug: string } }) {
  const [data, setData] = useState<{ poll: Reunion; dispos: Dispo[] } | null>(null)
  const [error, setError] = useState('')
  const [hidden, setHidden] = useState<Set<string>>(new Set()) // réponses décochées
  const [focus, setFocus] = useState<string | null>(null)
  const [prefs, setPrefs] = useState<Set<Pref>>(new Set())
  const [asking, setAsking] = useState(false)
  const [pseudo, setPseudo] = useState('')
  const [edit, setEdit] = useState<{ name: string; mine: Set<string> } | null>(null)
  const [busy, setBusy] = useState(false)
  const [removing, setRemoving] = useState<Dispo | null>(null)
  const [copied, setCopied] = useState(false)
  const [flash, setFlash] = useState('')

  const load = async () => {
    const res = await fetch(`/api/polls/${params.slug}`, { cache: 'no-store' })
    const body = await res.json()
    if (!res.ok) return setError(body.error ?? 'Chargement impossible.')
    setData(body)
    noter({ type: 'reunion', slug: params.slug, titre: body.poll.title })
    compterVue(params.slug)
  }
  useEffect(() => { load(); setPseudo(localStorage.getItem(PSEUDO) ?? '') }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const shown = useMemo(() => data?.dispos.filter((d) => !hidden.has(d.id)) ?? [], [data, hidden])
  const top = useMemo(() => (data ? best(data.poll, data.dispos) : null), [data])

  if (error) return <Page><p className="mt-16 text-center text-[15px] text-black/60">{error}</p></Page>
  if (!data || !top) return <Page><p className="mt-16 text-center text-[15px] text-black/60">Chargement…</p></Page>

  const { poll, dispos } = data
  const total = dispos.length
  const nPres = dispos.filter((d) => d.prefs.includes('presentiel')).length
  const nVisio = dispos.filter((d) => d.prefs.includes('visio')).length
  const nPrefs = dispos.filter((d) => d.prefs.length).length
  const prefWinner = !nPrefs ? '—' : nPres === nVisio ? 'Présentiel ou visio, à égalité' : nPres > nVisio ? 'Présentiel' : 'Visio'

  function start() {
    const name = pseudo.trim()
    if (!name) return
    localStorage.setItem(PSEUDO, name)
    const prev = dispos.find((d) => nameKey(d.name) === nameKey(name))
    if (prev && !prefs.size) setPrefs(new Set(prev.prefs))
    setEdit({ name: prev?.name ?? name, mine: new Set(prev?.slots ?? []) })
    setAsking(false)
  }

  async function save() {
    if (!edit) return
    setBusy(true)
    const res = await fetch(`/api/polls/${params.slug}/votes`, {
      method: 'PUT', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: edit.name, slots: [...edit.mine], prefs: [...prefs] }),
    })
    setBusy(false)
    if (!res.ok) return setFlash((await res.json()).error ?? 'Enregistrement impossible.')
    setEdit(null); setFlash('Vos disponibilités sont enregistrées.')
    load()
  }

  async function remove(d: Dispo) {
    await fetch(`/api/polls/${params.slug}/votes?id=${d.id}`, { method: 'DELETE' })
    setRemoving(null); setFlash(`Le vote de ${d.name} est supprimé.`)
    load()
  }

  async function copyBest() {
    const lines = [
      poll.title,
      ...top!.ranges.map((r) => `${rangeText(r)} (${top!.count}/${total} dispo)`),
      nPrefs ? `Préférence : ${prefWinner}` : '',
      window.location.href.split('?')[0],
    ].filter(Boolean)
    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const focusInfo = focus && (() => {
    const [date, time] = focus.split(' ')
    const [h, m] = time.split(':').map(Number)
    const yes = shown.filter((d) => d.slots.includes(focus)).map((d) => d.name)
    const no = shown.filter((d) => !d.slots.includes(focus)).map((d) => d.name)
    return { label: `${dayLong(date)}, ${time} – ${hhmm(h * 60 + m + STEP)}`, yes, no }
  })()

  return (
    <Page>
      {/* L'icône orange de Réunion, la même que sur la fiche dans Paraphe. */}
      <img src="/icon-reunion.png" alt="" className="mx-auto mt-10 h-12 w-12 rounded-xl sm:h-14 sm:w-14" />
      <h1 className="mt-4 text-balance text-center font-display text-4xl font-extrabold tracking-tight text-violet sm:text-6xl">{poll.title}</h1>
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[13.5px] text-black/55">
        {poll.event_url && <a className="underline decoration-violet/40 underline-offset-2 hover:text-violet" href={poll.event_url} target="_blank" rel="noreferrer">{poll.event_url.replace(/^https?:\/\//, '')}</a>}
        <span>Expiration du lien : {effaceLe(poll.created_at)}</span>
        <span>Lien vu {poll.vues ?? 0} fois</span>
        <Link className="underline decoration-violet/40 underline-offset-2 hover:text-violet" href={`/reunion/${params.slug}/modifier`}>Modifier le sondage</Link>
      </div>

      {/* Résultats */}
      <div className="mx-auto mt-9 grid max-w-3xl gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-[15px] font-medium">Meilleur résultat actuel {total > 0 && `(${top.count}/${total})`}</p>
          <div className="min-h-[60px] rounded-2xl border border-ink px-4 py-3">
            {top.ranges.length ? (
              <>
                <ul className="space-y-1">
                  {top.ranges.slice(0, 3).map((r) => (
                    <li key={`${r.date}${r.from}`} className="text-[15.5px] text-violet">
                      <span aria-hidden>✅ </span>{rangeText(r)}
                    </li>
                  ))}
                </ul>
                {top.ranges.length > 3 && <p className="mt-1 text-[12.5px] text-black/50">et {top.ranges.length - 3} autre{top.ranges.length > 4 ? 's' : ''} créneau{top.ranges.length > 4 ? 'x' : ''} à égalité</p>}
                <button className="mt-2 text-[13px] font-medium text-violet underline underline-offset-2" onClick={copyBest}>
                  {copied ? 'Copié !' : 'Copier le résultat'}
                </button>
              </>
            ) : <p className="text-[15px] text-black/45">Pas encore de réponse.</p>}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[15px] font-medium">Préférences {total > 0 && `(${nPrefs}/${total})`}</p>
          <div className="min-h-[60px] rounded-2xl border border-ink px-4 py-3">
            <p className="text-[15.5px]">{prefWinner}</p>
            {nPrefs > 0 && <p className="mt-1 text-[12.5px] text-black/50">Présentiel {nPres} · Visio {nVisio}</p>}
          </div>
        </div>
      </div>

      {/* Qui a répondu : décocher pour retirer de la grille, × pour supprimer le vote */}
      {total > 0 && (
        <ul className="mx-auto mt-6 flex max-w-3xl flex-wrap gap-x-5 gap-y-2">
          {dispos.map((d) => (
            <li key={d.id} className="flex items-center gap-1.5 text-[14px]">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" className="h-[18px] w-[18px] accent-violet" checked={!hidden.has(d.id)}
                  onChange={() => { const n = new Set(hidden); n.has(d.id) ? n.delete(d.id) : n.add(d.id); setHidden(n) }} />
                {d.name}
              </label>
              <button className="grid h-6 w-6 place-items-center rounded-full text-black/35 hover:bg-rose hover:text-ink"
                onClick={() => setRemoving(d)} aria-label={`Supprimer le vote de ${d.name}`}>×</button>
            </li>
          ))}
        </ul>
      )}
      {removing && (
        <div className="mx-auto mt-3 flex max-w-3xl flex-wrap items-center gap-3 rounded-xl bg-rose px-4 py-3 text-[14px]">
          Supprimer le vote de <b>{removing.name}</b> ? C&apos;est définitif.
          <button className="rounded-full bg-ink px-4 py-1.5 text-white" onClick={() => remove(removing)}>Supprimer</button>
          <button className="underline" onClick={() => setRemoving(null)}>Garder</button>
        </div>
      )}
      <hr className="mx-auto mt-5 max-w-3xl border-t-2 border-ink" />

      {/* Saisie */}
      <div className="mx-auto mt-8 max-w-3xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <PrefsMenu value={prefs} onChange={setPrefs} />
          {edit ? (
            <div className="flex w-full gap-3 sm:w-auto">
              <button className="flex-1 rounded-xl bg-[#FF8A1F] px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-ink sm:flex-none"
                onClick={() => setEdit(null)}>Annuler</button>
              <button className="flex-1 rounded-xl bg-[#2FC25B] px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-ink disabled:opacity-60 sm:flex-none"
                onClick={save} disabled={busy}>{busy ? '…' : 'Valider'}</button>
            </div>
          ) : asking ? (
            <form className="flex w-full gap-2 sm:w-auto" onSubmit={(e) => { e.preventDefault(); start() }}>
              <input className="field py-2.5" autoFocus value={pseudo} onChange={(e) => setPseudo(e.target.value)}
                placeholder="Votre pseudo" aria-label="Votre pseudo" maxLength={60} />
              <button className="rounded-xl bg-violet px-5 text-[13px] font-bold uppercase text-white disabled:opacity-50" disabled={!pseudo.trim()}>OK</button>
            </form>
          ) : (
            <button className="w-full rounded-xl bg-violet px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-white hover:bg-violet-dark sm:w-auto"
              onClick={() => { setFlash(''); setAsking(true) }}>Je saisis mes disponibilités</button>
          )}
        </div>

        {edit && (
          <p className="mt-4 rounded-xl bg-moss/10 px-4 py-2.5 text-[14px]">
            <b>{edit.name}</b> : touchez ou glissez sur la grille pour cocher vos créneaux libres, puis Valider.
          </p>
        )}
        {flash && !edit && <p className="mt-4 rounded-xl bg-violet-wash px-4 py-2.5 text-[14px]">{flash}</p>}

        {/* La grille arrive en deuxième : après « Je saisis mes disponibilités », ou dès qu'il y a des réponses à montrer. */}
        <div className={`mt-4 ${edit || total > 0 ? '' : 'hidden'}`}>
          {edit ? (
            <Grille dates={poll.dates} earliest={poll.earliest} latest={poll.latest}
              mine={edit.mine} onMine={(mine) => setEdit({ ...edit, mine })} />
          ) : (
            <Grille dates={poll.dates} earliest={poll.earliest} latest={poll.latest}
              dispos={shown} focus={focus} onFocus={setFocus} />
          )}
        </div>

        {!edit && focusInfo && (
          <div className="mt-3 rounded-xl border border-black/10 px-4 py-3 text-[14px]">
            <p className="font-medium">{focusInfo.label}</p>
            <p className="mt-1 text-moss">Dispo : {focusInfo.yes.join(', ') || 'personne'}</p>
            {focusInfo.no.length > 0 && <p className="text-black/50">Pas dispo : {focusInfo.no.join(', ')}</p>}
          </div>
        )}

        <p className="mt-5 flex items-center gap-2 text-[16px]"><span aria-hidden>✎</span> Pour modifier, saisissez le même pseudo</p>
      </div>
    </Page>
  )
}

function PrefsMenu({ value, onChange }: { value: Set<Pref>; onChange: (v: Set<Pref>) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const close = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])
  const label = value.size ? [...value].map((p) => PREF_LABEL[p]).join(' ou ') : 'Je préfère'
  return (
    <div ref={ref} className="relative w-full sm:w-72">
      <p className="mb-1.5 text-[15px] font-medium">Préférences (optionnel)</p>
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between rounded-xl border border-black/20 bg-white px-3 py-2.5 text-left text-[15px] ${value.size ? '' : 'text-black/40'}`}>
        {label}<span className="text-violet" aria-hidden>⌄</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl bg-white shadow-card ring-1 ring-black/5">
          {(['presentiel', 'visio'] as Pref[]).map((p) => (
            <button key={p} type="button" role="menuitemcheckbox" aria-checked={value.has(p)}
              className="flex w-full items-center justify-between px-3 py-3 text-left text-[14px] hover:bg-violet-wash"
              onClick={() => { const n = new Set(value); n.has(p) ? n.delete(p) : n.add(p); onChange(n) }}>
              {PREF_LABEL[p]}<span className="text-violet">{value.has(p) ? '✓' : ''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-5">
      <Haut />
      {children}
    </main>
  )
}
