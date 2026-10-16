'use client'

import { Ajouts, Retraits } from '@/components/Ecart'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Wordmark } from '@/components/Wordmark'
import { BasculePages } from '@/components/BasculePages'
import { AutoTextarea } from '@/components/AutoTextarea'
import { noter } from '@/lib/espace'
import { STANCE_SHORT, type Appeal, type Signatory, type Suggestion, type Version } from '@/lib/types'

type Payload = {
  appeal: Appeal
  signatories: Signatory[]
  suggestions: Suggestion[]
  versions: Version[]
  isAdmin: boolean
}

export default function Pilote({ params }: { params: { slug: string } }) {
  const [k, setK] = useState('')
  const [data, setData] = useState<Payload | null>(null)
  const [error, setError] = useState('')
  const [refus, setRefus] = useState('') // message du serveur quand une action est refusée
  const [applique, setApplique] = useState('') // modif en cours d'intégration

  const load = async (key = k) => {
    const res = await fetch(`/api/appeals/${params.slug}?k=${encodeURIComponent(key)}`, { cache: 'no-store' })
    const body = await res.json()
    if (!res.ok) return setError(body.error ?? 'Chargement impossible.')
    setData(body)
    if (body.isAdmin) noter({ type: 'pilote', slug: params.slug, titre: body.appeal.title, k: key })
  }

  useEffect(() => {
    const key = new URLSearchParams(window.location.search).get('k') ?? ''
    setK(key)
    if (key) load(key)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function patch(payload: Record<string, unknown>) {
    const res = await fetch(`/api/appeals/${params.slug}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ k, ...payload }),
    })
    setRefus(res.ok ? '' : (await res.json().catch(() => ({}))).error ?? 'Action impossible.')
    await load()
    return res.ok
  }

  async function setStatus(id: string, status: 'open' | 'accepted' | 'rejected') {
    await fetch(`/api/appeals/${params.slug}/suggestions/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ k, status }),
    })
    load()
  }

  // « OK » sur une modif proposée : le passage cité est remplacé dans le texte, une nouvelle version est publiée
  // tout de suite, et la modif passe « intégrée ». Seulement si le passage cité se trouve tel quel dans le texte en ligne.
  // « OK » sur un titre proposé : le titre change tout de suite, la proposition passe « intégrée ».
  async function changerTitre(s: Suggestion) {
    setApplique(s.id)
    if (await patch({ title: s.proposal })) await setStatus(s.id, 'accepted')
    setApplique('')
  }

  async function appliquer(s: Suggestion, fond: boolean) {
    if (!data || !s.quote || !data.appeal.body.includes(s.quote)) return
    setApplique(s.id)
    const ok = await patch({ body: data.appeal.body.replace(s.quote, s.proposal), note: `Modification de ${s.author} intégrée`, fond })
    if (ok) await setStatus(s.id, 'accepted')
    setApplique('')
  }

  if (error) return <Wrap><p className="text-[15px] text-black/60">{error}</p></Wrap>
  if (!data)
    return (
      <Wrap>
        {k ? (
          <p className="text-[15px] text-black/60">Chargement…</p>
        ) : (
          <>
            <h1 className="text-xl font-semibold">Clé de pilotage manquante.</h1>
            <p className="mt-2 text-[15px] text-black/60">
              Le lien de pilotage se termine par <code>?k=…</code>. Sans lui, cette page ne montre rien.
            </p>
            <Link className="btn-ghost mt-5" href={`/signature/${params.slug}`}>Voir la page publique</Link>
          </>
        )}
      </Wrap>
    )
  if (!data.isAdmin)
    return (
      <Wrap>
        <h1 className="text-xl font-semibold">Clé de pilotage invalide.</h1>
        <Link className="btn-ghost mt-5" href={`/signature/${params.slug}`}>Voir la page publique</Link>
      </Wrap>
    )

  const { appeal, signatories, suggestions, versions } = data
  const said = (s: Signatory) => s.stance === 'oui' || s.stance === 'oui_si_modifs'
  const stale = signatories.filter((s) => said(s) && s.version < appeal.version)
  const counts = {
    oui: signatories.filter((s) => s.stance === 'oui').length,
    reserve: signatories.filter((s) => s.stance === 'oui_si_modifs').length,
    reflexion: signatories.filter((s) => s.stance === 'reflexion').length,
    non: signatories.filter((s) => s.stance === 'non').length,
    logos: signatories.filter((s) => s.logo_url).length,
  }

  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-8">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Wordmark size="sm" />
        <BasculePages slug={params.slug} k={k} ici="pilote" />
      </div>

      <div className="card mt-6 p-6 sm:p-9">
        <p className="text-[12.5px] font-medium uppercase tracking-wide text-violet">
          Pilotage · version {appeal.version}
        </p>
        <div className="flex items-start gap-3">
          {/* Logo/icône du texte retiré le 16/10 à la demande de Ste (composant ImageTexte gardé). */}
          <div className="min-w-0 flex-1"><Titre key={appeal.title} titre={appeal.title} onSave={(title) => patch({ title })} /></div>
        </div>
        <Porteur key={appeal.porteur ?? ''} valeur={appeal.porteur ?? ''} onSave={(porteur) => patch({ porteur })} />
        <LienSignataires slug={params.slug} />
        <LienPilotage slug={params.slug} k={k} />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat n={counts.oui} label="Oui, je signe" />
          <Stat n={counts.reserve} label="Oui, si les modifs suggérées sont intégrées" />
          <Stat n={counts.non} label="Non" />
          <Stat n={counts.reflexion} label="En cours de réflexion" />
          <Stat n={counts.logos} label="logos reçus" />
          <Stat n={appeal.vues ?? 0} label="vues du lien" />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <a className="btn-primary" href={`/api/appeals/${params.slug}/export?k=${encodeURIComponent(k)}`}>
            Télécharger les signataires (CSV)
          </a>
          <button className="btn-dark" onClick={() => patch({ closed: !appeal.closed })}>
            {appeal.closed ? 'Rouvrir les signatures' : 'Clore les signatures'}
          </button>
          <button className="btn border border-black/20 bg-white" onClick={() => patch({ hors_ligne: !appeal.hors_ligne })}>
            {appeal.hors_ligne ? 'Remettre en ligne' : 'Mettre hors ligne'}
          </button>
        </div>
        {refus && <p className="mt-4 rounded-xl bg-rose px-4 py-3 text-[14px]">{refus}</p>}
        {appeal.hors_ligne && (
          <p className="mt-4 rounded-xl bg-wall px-4 py-3 text-[14px]">
            Ce texte est <b>hors ligne</b> : le lien public affiche « Ce texte n’est plus en ligne ». Il est archivé : gardé ici sans limite de temps, avec ses signataires.
          </p>
        )}
      </div>

      {stale.length > 0 && <Revalidation slug={params.slug} stale={stale} version={appeal.version} />}

      <NewVersion key={appeal.version} appeal={appeal} onPublish={(body, note, fond) => patch({ body, note, fond })} />

      <section className="card mt-5 p-6 sm:p-9">
        <h2 className="text-lg font-semibold">Historique du texte</h2>
        <ul className="mt-4 space-y-2">
          {versions.map((v) => (
            <VersionRow key={v.id} v={v} current={v.number === appeal.version} />
          ))}
        </ul>
      </section>

      <section className="card mt-5 p-6 sm:p-9">
        <h2 className="text-lg font-semibold">Modifications proposées</h2>
        {suggestions.length === 0 && <p className="mt-2 text-[14px] text-black/55">Aucune pour l&apos;instant.</p>}
        <ul className="mt-4 space-y-3">
          {suggestions.map((s) => (
            <li key={s.id} className="rounded-xl border border-black/10 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[14.5px] font-medium">{s.author}{s.cible === 'titre' && <span className="ml-2 rounded-full bg-wall px-2 py-0.5 text-[12px] font-normal text-black/55">titre</span>}</p>
                <span className="text-[12.5px] text-black/45">
                  sur la v{s.version} · {new Date(s.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
              {s.quote && <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] italic text-black/45">« <Retraits avant={s.quote} apres={s.proposal} /> »</p>}
              <p className="mt-1.5 whitespace-pre-wrap text-[14.5px] leading-relaxed"><Ajouts avant={s.quote} apres={s.proposal} /></p>
              {s.reason && <p className="mt-1 whitespace-pre-wrap text-[13.5px] text-black/55">{s.reason}</p>}
              {s.status === 'open' && s.cible === 'titre' && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[13.5px]">
                  <button className="btn-primary text-[13.5px]" disabled={!!applique} onClick={() => changerTitre(s)}>
                    {applique === s.id ? 'Changement…' : 'OK, prendre ce titre'}
                  </button>
                </div>
              )}
              {s.status === 'open' && s.cible !== 'titre' && s.version === appeal.version && (
                s.quote && appeal.body.includes(s.quote) ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[13.5px]">
                    <span className="text-black/55">{applique === s.id ? 'Intégration…' : 'OK, intégrer :'}</span>
                    <button className="btn-primary text-[13.5px]" disabled={!!applique} onClick={() => appliquer(s, false)}
                      title="Remplace le passage cité ; les signataires n'ont pas à revalider">petite correction</button>
                    <button className="btn-ghost text-[13.5px]" disabled={!!applique} onClick={() => appliquer(s, true)}
                      title="Remplace le passage cité ; les signataires devront revalider">changement de fond</button>
                  </div>
                ) : (
                  <p className="mt-3 text-[12.5px] text-black/45">
                    {s.quote ? 'Le passage cité ne se trouve plus tel quel dans le texte' : 'Pas de passage cité'} : à intégrer à la main dans le texte ci-dessus.
                  </p>
                )
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Chip on={s.status === 'accepted'} onClick={() => setStatus(s.id, 'accepted')}>Intégrée</Chip>
                <Chip on={s.status === 'open'} onClick={() => setStatus(s.id, 'open')}>En discussion</Chip>
                <Chip on={s.status === 'rejected'} onClick={() => setStatus(s.id, 'rejected')}>Écartée</Chip>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[12.5px] text-black/45">
          « OK, intégrer » remplace le passage cité par la proposition et publie aussitôt une nouvelle version : petite correction,
          personne n&apos;a à revalider ; changement de fond, les signataires doivent revalider.
        </p>
      </section>

      <section className="card mt-5 p-6 sm:p-9">
        <h2 className="text-lg font-semibold">Les signataires</h2>
        {signatories.length === 0 && <p className="mt-2 text-[14px] text-black/55">Personne n&apos;a encore signé.</p>}
        {stale.length > 0 && (
          <p className="mt-1.5 text-[13.5px] text-black/55">« À revalider » : a signé une version plus ancienne du texte.</p>
        )}
        {signatories.length > 0 && <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[14px]">
            <thead className="text-[12.5px] uppercase tracking-wide text-black/45">
              <tr>
                <th className="pb-2 pr-4 font-medium">Nom</th>
                <th className="pb-2 pr-4 font-medium">Réponse</th>
                <th className="pb-2 pr-4 font-medium">Version</th>
                <th className="pb-2 pr-4 font-medium">Contact</th>
                <th className="pb-2 pr-4 font-medium">Logo</th>
                <th className="pb-2 font-medium"><span className="sr-only">Lien de signataire</span></th>
              </tr>
            </thead>
            <tbody>
              {signatories.map((s) => (
                <tr key={s.id} className="border-t border-black/[.07]">
                  <td className="py-2.5 pr-4">
                    <span className="font-medium">{s.name}</span>
                    {(s.role || s.city) && (
                      <span className="block text-[12.5px] text-black/50">{[s.role, s.city].filter(Boolean).join(' · ')}</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4">{STANCE_SHORT[s.stance]}</td>
                  <td className="py-2.5 pr-4">
                    v{s.version}
                    {said(s) && s.version < appeal.version && (
                      <span className="ml-2 rounded-full bg-rose px-2 py-0.5 text-[11.5px] font-medium" title={`Signé en v${s.version}, le texte est en v${appeal.version}`}>à revalider</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-black/60">{s.email ?? '—'}</td>
                  <td className="py-2.5 pr-4">
                    {s.logo_url ? (
                      <a className="text-violet underline" href={s.logo_url} target="_blank" rel="noreferrer">Ouvrir</a>
                    ) : '—'}
                  </td>
                  <td className="py-2.5">
                    <CopyLink slug={params.slug} token={s.edit_token ?? ''} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}
      </section>
    </main>
  )
}

function Revalidation({ slug, stale, version }: { slug: string; stale: Signatory[]; version: number }) {
  const url = typeof window !== 'undefined' ? `${window.location.origin}/signature/${slug}` : ''
  const emails = stale.map((s) => s.email).filter(Boolean).join(',')
  const subject = encodeURIComponent(`Le texte a changé : merci de revalider (v${version})`)
  const body = encodeURIComponent(
    `Bonjour,\n\nLe texte que vous aviez signé a été modifié. La version en cours est la v${version}.\n` +
      `Merci de le relire et de revalider ici :\n${url}\n\n` +
      `Si vous avez perdu votre lien de signataire, répondez à ce message : nous vous le renverrons.\n`,
  )

  return (
    <section className="mt-5 rounded-2xl bg-ink p-6 text-white sm:p-9">
      <h2 className="text-lg font-semibold">
        {stale.length} signataire{stale.length > 1 ? 's ont' : ' a'} signé une version antérieure
      </h2>
      <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/65">
        Leur accord porte sur un texte qui n&apos;est plus celui en ligne. Tant qu&apos;ils n&apos;ont pas revalidé, ne les
        comptez pas parmi les signataires de la v{version}.
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {stale.map((s) => (
          <li key={s.id} className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[13px]">
            <span>{s.name}</span>
            <span className="text-white/50">v{s.version}</span>
            {s.edit_token && (
              <button
                className="text-white/60 underline hover:text-white"
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/signature/${slug}?s=${s.edit_token}`)}
                title="Copier son lien de signataire"
              >
                lien
              </button>
            )}
          </li>
        ))}
      </ul>
      {emails ? (
        <a className="btn mt-5 bg-white text-ink hover:bg-white/90" href={`mailto:?bcc=${emails}&subject=${subject}&body=${body}`}>
          Écrire aux {stale.filter((s) => s.email).length} contacts
        </a>
      ) : (
        <p className="mt-5 text-[13px] text-white/50">Aucun de ces signataires n&apos;a laissé d&apos;email.</p>
      )}
    </section>
  )
}

function NewVersion({ appeal, onPublish }: { appeal: Appeal; onPublish: (body: string, note: string, fond: boolean) => Promise<boolean> }) {
  const [body, setBody] = useState(appeal.body)
  const [fond, setFond] = useState<boolean | null>(null) // à choisir avant de publier
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const dirty = body.trim() !== appeal.body.trim() && body.trim().length > 0

  return (
    <section className="card mt-5 p-6 sm:p-9">
      <h2 className="text-lg font-semibold">Le texte</h2>
      <p className="mt-1.5 text-[13.5px] text-black/55">
        Chaque publication crée une version numérotée. Petite correction : personne n&apos;a à revalider. Changement de
        fond : les signataires devront revalider.
      </p>
      <AutoTextarea className="field mt-4 min-h-[240px] leading-relaxed" value={body} onChange={(e) => setBody(e.target.value)} />
      <input className="field mt-3" value={note} onChange={(e) => setNote(e.target.value)}
        placeholder="Ce qui change dans cette version (ex. : reprise du 2e paragraphe suite aux modifs)" />
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[14px]">
        <label className="flex cursor-pointer items-center gap-2">
          <input type="radio" name="fond" className="accent-[#4B2AEF]" checked={fond === false} onChange={() => setFond(false)} />
          Petite correction <span className="text-black/45">(personne n&apos;a à revalider)</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input type="radio" name="fond" className="accent-[#4B2AEF]" checked={fond === true} onChange={() => setFond(true)} />
          Changement de fond <span className="text-black/45">(les signataires doivent revalider)</span>
        </label>
      </div>
      <button
        className="btn-primary mt-4"
        disabled={!dirty || busy || fond === null}
        onClick={async () => { setBusy(true); await onPublish(body, note, fond!); setNote(''); setBusy(false) }}
      >
        {busy ? 'Publication…' : `Publier la version ${appeal.version + 1}`}
      </button>
      {!dirty ? <p className="mt-2 text-[12.5px] text-black/40">Modifiez le texte pour pouvoir publier.</p>
        : fond === null && <p className="mt-2 text-[12.5px] text-black/40">Choisissez petite correction ou changement de fond.</p>}
    </section>
  )
}

function VersionRow({ v, current }: { v: Version; current: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <li className="rounded-xl border border-black/10">
      <button className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left" onClick={() => setOpen(!open)}>
        <span>
          <span className="text-[14.5px] font-medium">
            Version {v.number}
            {current && <span className="ml-2 rounded-full bg-violet-wash px-2 py-0.5 text-[11.5px] font-semibold text-violet">en ligne</span>}
          </span>
          <span className="block text-[12.5px] text-black/50">
            {new Date(v.created_at).toLocaleString('fr-FR')}
            {v.note && ` · ${v.note}`}
          </span>
        </span>
        <span className="shrink-0 text-[13px] text-violet">{open ? 'Replier' : 'Lire'}</span>
      </button>
      {open && <pre className="whitespace-pre-wrap border-t border-black/[.07] px-4 py-3 font-sans text-[14px] leading-relaxed">{v.body}</pre>}
    </li>
  )
}

function CopyLink({ slug, token }: { slug: string; token: string }) {
  const [done, setDone] = useState(false)
  if (!token) return <span className="text-black/35">—</span>
  return (
    <button
      title="Si cette personne a perdu son lien pour modifier sa réponse : copiez-le et envoyez-le-lui, à elle seule."
      className="whitespace-nowrap text-[12.5px] text-black/45 underline hover:text-violet"
      onClick={() => {
        navigator.clipboard.writeText(`${window.location.origin}/signature/${slug}?s=${token}`)
        setDone(true)
        setTimeout(() => setDone(false), 1800)
      }}
    >
      {done ? 'Lien copié' : 'Renvoyer son lien'}
    </button>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-xl bg-wall px-4 py-3">
      <p className="text-2xl font-semibold tabular-nums">{n}</p>
      <p className="text-[12.5px] text-black/55">{label}</p>
    </div>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
        on ? 'bg-violet text-white' : 'bg-wall text-black/60 hover:bg-black/10'
      }`}>
      {children}
    </button>
  )
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-5 pt-8">
      <Wordmark size="sm" />
      <div className="card mt-6 p-9">{children}</div>
    </main>
  )
}

// Mémo : le lien public à envoyer aux organisations, toujours sous la main.
function LienSignataires({ slug }: { slug: string }) {
  const [copie, setCopie] = useState(false)
  const lien = typeof window !== 'undefined' ? `${window.location.origin}/signature/${slug}` : ''
  return (
    <div className="mt-4 rounded-xl bg-wall px-4 py-3 text-[13.5px]">
      <p className="text-black/55">Lien du document à envoyer pour signature</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span className="min-w-0 flex-1 break-all font-mono text-[13px]">{lien}</span>
        <button className="shrink-0 rounded-lg border border-black/20 bg-white px-3 py-1"
          onClick={() => { navigator.clipboard.writeText(lien); setCopie(true); setTimeout(() => setCopie(false), 2000) }}>
          {copie ? 'Copié' : 'Copier'}
        </button>
      </div>
    </div>
  )
}

// Piloter à plusieurs : le même lien de pilotage, partagé avec les autres organisations.
function LienPilotage({ slug, k }: { slug: string; k: string }) {
  const [copie, setCopie] = useState(false)
  const lien = typeof window !== 'undefined' ? `${window.location.origin}/signature/${slug}/pilote?k=${k}` : ''
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[13px] text-black/55">
      <span>Vous pilotez à plusieurs ? Partagez ce lien de pilotage avec les autres organisations.</span>
      <button className="rounded-lg border border-black/20 bg-white px-3 py-1 text-ink"
        onClick={() => { navigator.clipboard.writeText(lien); setCopie(true); setTimeout(() => setCopie(false), 2000) }}>
        {copie ? 'Copié' : 'Copier le lien de pilotage'}
      </button>
    </div>
  )
}

// Titre modifiable sur place : on clique dedans, on tape, Entrée ou clic ailleurs pour enregistrer.
function Titre({ titre, onSave }: { titre: string; onSave: (t: string) => Promise<boolean> }) {
  const [v, setV] = useState(titre)
  const [etat, setEtat] = useState('')
  async function enregistrer() {
    const t = v.trim()
    if (!t || t === titre) return setV(titre)
    setEtat('Enregistrement…')
    setEtat((await onSave(t)) ? 'Titre enregistré' : '')
  }
  return (
    <div className="mt-1">
      <input aria-label="Titre du texte" value={v} onChange={(e) => { setV(e.target.value); setEtat('') }}
        onBlur={enregistrer} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
        className="-mx-2 w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-2xl font-semibold tracking-tight hover:border-black/15 focus:border-violet focus:outline-none" />
      <p className="h-4 px-0.5 text-[12px] text-black/45">{etat || (v === titre ? 'Cliquez sur le titre pour le modifier.' : 'Entrée pour enregistrer.')}</p>
    </div>
  )
}

// Image du texte : clic pour en choisir une (elle remplace l'icône R! bleue sur la page publique et dans Paraphe).
function ImageTexte({ slug, k, path, onChange }: { slug: string; k: string; path: string | null; onChange: () => void }) {
  const [etat, setEtat] = useState('')
  async function envoyer(f: File | null) {
    if (!f) return
    setEtat('Envoi…')
    const form = new FormData()
    form.set('k', k)
    form.set('image', f)
    const res = await fetch(`/api/appeals/${slug}/image`, { method: 'POST', body: form })
    setEtat(res.ok ? '' : (await res.json().catch(() => ({}))).error ?? 'Envoi impossible.')
    if (res.ok) onChange()
  }
  async function retirer() {
    await fetch(`/api/appeals/${slug}/image`, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ k }) })
    onChange()
  }
  return (
    <div className="mt-2 flex shrink-0 flex-col items-center gap-1">
      <label className="group relative cursor-pointer" title="Changer l’image du texte">
        <img src={path ? `/api/appeals/${slug}/image?v=${encodeURIComponent(path)}` : '/icon-textes.png'} alt="Image du texte"
          className="h-10 w-10 rounded-xl object-cover ring-violet group-hover:ring-2" />
        <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-white text-[11px] shadow" aria-hidden>✎</span>
        <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => envoyer(e.target.files?.[0] ?? null)} />
      </label>
      {path && <button className="text-[11px] text-black/40 underline hover:text-black" onClick={retirer} title="Revenir à l’icône R!">retirer</button>}
      {etat && <span className="max-w-[9rem] text-center text-[11px] text-black/55">{etat}</span>}
    </div>
  )
}

// « Porté par » : l'organisation qui porte le texte, affichée sur la page publique et dans Paraphe (sinon « Resist ! »).
function Porteur({ valeur, onSave }: { valeur: string; onSave: (v: string) => Promise<boolean> }) {
  const [v, setV] = useState(valeur)
  const [ok, setOk] = useState(false)
  async function enregistrer() {
    if (v.trim() === valeur.trim()) return
    setOk(await onSave(v.trim()))
  }
  return (
    <label className="mt-3 flex flex-wrap items-center gap-2 text-[14px]">
      <span className="text-black/55">Nom de l&apos;organisation</span>
      <input className="min-w-[14rem] flex-1 rounded-lg border border-black/15 bg-white px-3 py-1.5" value={v} placeholder="Nom de l’organisation ou du collectif"
        onChange={(e) => { setV(e.target.value); setOk(false) }} onBlur={enregistrer}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }} />
      {ok && <span className="text-[12px] text-black/45">Enregistré</span>}
    </label>
  )
}
