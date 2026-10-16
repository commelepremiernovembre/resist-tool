'use client'

import { Ajouts, Retraits } from '@/components/Ecart'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Wordmark } from '@/components/Wordmark'
import { BasculePages } from '@/components/BasculePages'
import { effaceLe } from '@/lib/duree'
import { lireCache, noter } from '@/lib/espace'
import { STANCE_LABEL, STANCE_SHORT, type Appeal, type Signatory, type Stance, type Suggestion } from '@/lib/types'

type Payload = { appeal: Appeal; signatories: Signatory[]; suggestions: Suggestion[] }

const hasSigned = (s: Signatory) => s.stance === 'oui' || s.stance === 'oui_si_modifs'

// Une vue par visite (onglet) ; celles de la personne qui pilote le texte ne comptent pas.
function compterVue(slug: string) {
  try {
    if (lireCache().some((x) => x.type === 'pilote' && x.slug === slug)) return
    if (sessionStorage.getItem('resist:vu:' + slug)) return
    sessionStorage.setItem('resist:vu:' + slug, '1')
  } catch {}
  fetch(`/api/appeals/${slug}/vue`, { method: 'POST' }).catch(() => {})
}

export default function TexteASigner({ params }: { params: { slug: string } }) {
  const [data, setData] = useState<Payload | null>(null)
  const [error, setError] = useState('')
  const [target, setTarget] = useState<{ index: number; quote: string; titre?: boolean } | null>(null)
  const [pilote, setPilote] = useState<string | null>(null) // clé de pilotage si ce texte est dans « Textes que je pilote »

  const load = async () => {
    const res = await fetch(`/api/appeals/${params.slug}`, { cache: 'no-store' })
    const body = await res.json()
    if (!res.ok) return setError(body.error ?? 'Chargement impossible.')
    setData(body)
    // Déjà signé depuis cet appareil (ou lien personnel) : le texte rejoint Mon espace.
    const s = new URLSearchParams(window.location.search).get('s') || localStorage.getItem(storeKey(params.slug))
    if (s) noter({ type: 'signe', slug: params.slug, titre: body.appeal.title, s })
    compterVue(params.slug)
    setPilote(lireCache().find((x) => x.type === 'pilote' && x.slug === params.slug)?.k ?? null)
  }
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Le formulaire n'existe qu'après chargement : le navigateur ne peut pas suivre #signer tout seul.
  const loaded = data !== null
  useEffect(() => {
    if (loaded && window.location.hash === '#signer') document.getElementById('signer')?.scrollIntoView()
  }, [loaded])

  const paragraphs = useMemo(
    () => (data?.appeal.body ?? '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
    [data?.appeal.body],
  )

  if (error) return <Empty message={error} />
  if (!data) return <Empty message="Chargement…" />

  const { appeal, signatories, suggestions } = data
  const signed = signatories.filter(hasSigned)
  const current = signed.filter((s) => s.version === appeal.version)
  const stale = signed.length - current.length
  // Seules les modifs en discussion s'affichent : les intégrées ou refusées coupaient la lecture du texte (elles restent dans le pilotage).
  const open = suggestions.filter((s) => s.status === 'open' && s.cible !== 'titre')
  const titresProposes = suggestions.filter((s) => s.status === 'open' && s.cible === 'titre')

  const forParagraph = (i: number) =>
    open.filter((s) => s.quote && paragraphs[i]?.includes(s.quote.slice(0, 40)))

  function suggestOn(i: number) {
    const selection = typeof window !== 'undefined' ? String(window.getSelection() ?? '').trim() : ''
    setTarget({ index: i, quote: selection || paragraphs[i] }) // sans sélection : le paragraphe entier
  }

  return (
    <main className="mx-auto max-w-6xl px-5 pb-28 pt-8">
      {/* Propriétaire du texte (il est dans son Mon espace) : bascule vers la page de pilotage. */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Wordmark size="sm" />
        {pilote && <BasculePages slug={params.slug} k={pilote} ici="publique" />}
      </div>

      <header className="card mt-6 p-6 sm:p-10">
        {appeal.closed && (
          <p className="mb-4 inline-block rounded-full bg-ink px-3 py-1 text-[12.5px] font-medium text-white">
            Signatures closes
          </p>
        )}
        {/* Icône du texte retirée le 16/10 à la demande de Ste. */}
        {pilote
          ? <TitrePilote key={appeal.title} slug={params.slug} k={pilote} titre={appeal.title} onSaved={load} />
          : <TitrePublic titre={appeal.title} ouvert={!appeal.closed} onProposer={() => setTarget({ index: -1, quote: appeal.title, titre: true })} />}
        {titresProposes.map((s) => <SuggestionNote key={s.id} s={s} />)}
        {appeal.porteur && <p className="mt-2 text-[15px] font-medium text-black/70">Porté par {appeal.porteur}</p>}
        {appeal.intro && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-black/60">{appeal.intro}</p>}
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-[13.5px] text-black/55">
          <span><strong className="font-semibold text-ink">{current.length}</strong> signataires de la version en cours</span>
          <span><strong className="font-semibold text-ink">{open.filter((s) => s.status === 'open').length}</strong> modifs en discussion</span>
          {appeal.deadline && <span>À signer avant le {new Date(appeal.deadline).toLocaleDateString('fr-FR')}</span>}
          {appeal.contact && <span>Contact : {appeal.contact}</span>}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[12.5px]">
          <span className="rounded-full bg-violet-wash px-3 py-1 font-semibold text-violet">Version {appeal.version}</span>
          <span className="text-black/45">
            {appeal.version > 1 ? 'Dernière modification le ' : 'Publié le '}
            {new Date(appeal.updated_at ?? appeal.created_at).toLocaleDateString('fr-FR')}
          </span>
          <span className="text-black/45">Expiration du lien : {effaceLe(appeal.created_at)}</span>
          {stale > 0 && (
            <span className="text-black/45">
              {stale} signataire{stale > 1 ? 's' : ''} n&apos;{stale > 1 ? 'ont' : 'a'} pas encore revalidé
            </span>
          )}
        </div>
      </header>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <article className="card p-6 sm:p-10">
          <p className="mb-6 text-[12.5px] text-black/45">
            Une modification à suggérer ? Sélectionnez le texte à modifier et cliquez sur l&apos;icône crayon ✎ à droite du paragraphe.
          </p>
          {paragraphs.map((p, i) => {
            const notes = forParagraph(i)
            return (
              <div key={i} className="group relative -mx-3 mb-3 rounded-xl py-1.5 pl-3 pr-10 transition hover:bg-violet-wash/50">
                <p className="whitespace-pre-wrap text-[16.5px] leading-[1.75]">{p}</p>
                {/* Crayon dans la marge : le texte se lit d'un bloc, sans bouton entre les strophes. */}
                <button
                  onClick={() => suggestOn(i)}
                  title="Suggérer une modif sur ce paragraphe"
                  aria-label="Suggérer une modif sur ce paragraphe"
                  className="absolute right-1 top-1.5 rounded-lg px-2 py-1 text-[15px] text-black/30 transition hover:bg-ink hover:text-white group-hover:text-black/70"
                >
                  ✎
                </button>
                {notes.length > 0 && (
                  <p className="mt-1 text-[12.5px] font-medium text-violet">
                    {notes.length} modif{notes.length > 1 ? 's' : ''} en discussion sur ce paragraphe
                  </p>
                )}
                {notes.map((n) => (
                  <SuggestionNote key={n.id} s={n} />
                ))}
              </div>
            )
          })}
        </article>

        <aside className="space-y-5">
          {!appeal.closed && <SignBox slug={params.slug} version={appeal.version} onDone={load} />}
          <Signatories list={signatories} version={appeal.version} />
        </aside>
      </div>

      {target && (
        <SuggestModal
          slug={params.slug}
          quote={target.quote}
          titre={target.titre}
          onClose={() => setTarget(null)}
          onDone={() => { setTarget(null); load() }}
        />
      )}
    </main>
  )
}

function SuggestionNote({ s }: { s: Suggestion }) {
  return (
    <div className={`mt-2 rounded-xl border-l-[3px] px-3.5 py-2.5 text-[13.5px] ${
      s.status === 'accepted' ? 'border-moss bg-moss/[.07]' : 'border-violet bg-violet-wash/60'
    }`}>
      <p className="font-medium">
        {s.author}
        {s.status === 'accepted' && <span className="ml-2 text-[12px] font-semibold text-moss">intégrée</span>}
      </p>
      {s.quote && <p className="mt-1 whitespace-pre-wrap italic text-black/45">« <Retraits avant={s.quote} apres={s.proposal} /> »</p>}
      <p className="mt-1 whitespace-pre-wrap leading-relaxed"><Ajouts avant={s.quote} apres={s.proposal} /></p>
      {s.reason && <p className="mt-1 whitespace-pre-wrap text-black/55">{s.reason}</p>}
    </div>
  )
}

function SuggestModal({ slug, quote, titre, onClose, onDone }: { slug: string; quote: string; titre?: boolean; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ author: '', quote, proposal: '', reason: '', ...(titre ? { cible: 'titre' } : {}) })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus() }, [])

  async function send() {
    setBusy(true); setErr('')
    const res = await fetch(`/api/appeals/${slug}/suggestions`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f),
    })
    const body = await res.json(); setBusy(false)
    if (!res.ok) return setErr(body.error ?? 'Envoi impossible.')
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" onClick={onClose}>
      <div className="card max-h-[92vh] w-full max-w-2xl overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">{titre ? 'Proposer un autre titre' : 'Suggérer une modification'}</h2>
        <p className="mt-1 text-[13.5px] text-black/55">{titre ? 'Le titre change quand la personne qui pilote le texte accepte votre proposition.' : <>Le passage visé est repris ci-dessous, vous pouvez l&apos;ajuster.</>}</p>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label" htmlFor="s-author">Vous êtes</label>
            <input id="s-author" ref={ref} className="field" value={f.author}
              onChange={(e) => setF({ ...f, author: e.target.value })} placeholder="Organisation ou prénom" />
          </div>
          {titre ? (
          <div>
            <p className="label">Titre actuel</p>
            <p className="text-[14px] italic text-black/60">{quote}</p>
          </div>
          ) : (
          <div>
            <label className="label" htmlFor="s-quote">Passage visé</label>
            <textarea id="s-quote" className="field min-h-[140px] text-[14px] italic" value={f.quote}
              onChange={(e) => setF({ ...f, quote: e.target.value })} />
          </div>
          )}
          <div>
            <label className="label" htmlFor="s-prop">{titre ? 'Titre proposé' : 'Votre proposition'}</label>
            {titre
              ? <input id="s-prop" className="field" value={f.proposal} onChange={(e) => setF({ ...f, proposal: e.target.value })} placeholder="Nouveau titre" />
              : <textarea id="s-prop" className="field min-h-[180px]" value={f.proposal}
                  onChange={(e) => setF({ ...f, proposal: e.target.value })} placeholder="Remplacer par…" />}
          </div>
          <div>
            <label className="label" htmlFor="s-why">Pourquoi <span className="text-black/35">(optionnel)</span></label>
            <input id="s-why" className="field" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} />
          </div>
          {err && <p className="rounded-xl bg-rose px-4 py-3 text-[14px]">{err}</p>}
          <div className="flex gap-3">
            <button className="btn-primary" onClick={send} disabled={busy}>{busy ? 'Envoi…' : 'Envoyer la modif'}</button>
            <button className="btn-ghost" onClick={onClose}>Annuler</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const STANCES: Stance[] = ['oui', 'oui_si_modifs', 'non', 'reflexion']

type Own = {
  name: string
  role: string | null
  city: string | null
  email: string | null
  note: string | null
  stance: Stance
  version: number
  logo_url: string | null
}

const storeKey = (slug: string) => `resist:signataire:${slug}`

function SignBox({ slug, version, onDone }: { slug: string; version: number; onDone: () => void }) {
  const [s, setS] = useState('')            // jeton de modification
  const [own, setOwn] = useState<Own | null>(null)
  const [stance, setStance] = useState<Stance>('oui')
  const [logo, setLogo] = useState<File | null>(null)
  const [logoMsg, setLogoMsg] = useState('')

  // Logo trop lourd : on le réduit ici, dans le navigateur, plutôt que de le refuser à l'envoi.
  async function choisirLogo(f: File | null) {
    setLogoMsg('')
    if (!f || f.size <= LOGO_MAX) return setLogo(f)
    const reduit = await reduireLogo(f).catch(() => null)
    if (reduit && reduit.size <= LOGO_MAX) {
      setLogo(reduit)
      setLogoMsg(`Votre logo pesait ${mo(f.size)} : il a été réduit à ${mo(reduit.size)} pour passer.`)
    } else {
      setLogo(null)
      setLogoMsg(`Ce fichier pèse ${mo(f.size)}, c'est trop lourd (2 Mo maximum) et il n'a pas pu être réduit. Choisissez une version plus légère de votre logo.`)
    }
  }
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [conflict, setConflict] = useState('')
  const [saved, setSaved] = useState<string | null>(null)
  const [envoye, setEnvoye] = useState(false) // bouton grisé après l'envoi, jusqu'au prochain changement

  // Le jeton arrive du lien personnel, sinon de ce navigateur.
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('s')
    const key = fromUrl || localStorage.getItem(storeKey(slug)) || ''
    if (!key) return
    setS(key)
    if (fromUrl) localStorage.setItem(storeKey(slug), fromUrl)
    fetch(`/api/appeals/${slug}/signatories?s=${encodeURIComponent(key)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => {
        if (!b?.signatory) return
        setOwn(b.signatory)
        setStance(b.signatory.stance)
      })
      .catch(() => {})
  }, [slug])

  async function submit(form: FormData, confirmNew = false) {
    setBusy(true)
    setErr('')
    setConflict('')
    form.set('stance', stance)
    if (s) form.set('s', s)
    if (confirmNew) form.set('confirm', 'nouveau')
    if (logo) form.set('logo', logo)
    const res = await fetch(`/api/appeals/${slug}/signatories`, { method: 'POST', body: form })
    const body = await res.json()
    setBusy(false)
    if (res.status === 409 && body.code === 'name_taken') return setConflict(body.error)
    if (!res.ok) return setErr(body.error ?? 'Envoi impossible.')
    localStorage.setItem(storeKey(slug), body.s)
    setSaved(body.s)
    setEnvoye(true)
    onDone()
  }

  const [pending, setPending] = useState<FormData | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setPending(form)
    submit(form)
  }

  if (saved) {
    const link = `${window.location.origin}/signature/${slug}?s=${saved}`
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold">C&apos;est enregistré.</h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-black/60">
          Votre réponse porte sur la version {version} du texte. Si elle change, on vous redemandera de valider.
        </p>
        <div className="mt-4 rounded-xl bg-violet-wash p-4">
          <p className="text-[12.5px] font-medium text-violet-dark">Votre lien de signataire (pour modifier ou revalider)</p>
          <code className="mt-2 block break-all text-[12.5px]">{link}</code>
          <button className="btn mt-3 bg-violet px-4 py-2 text-[13px] text-white" onClick={() => navigator.clipboard.writeText(link)}>
            Copier le lien
          </button>
          <p className="mt-2 text-[12px] leading-relaxed text-black/50">
            Gardez-le : c&apos;est lui, et pas votre nom, qui prouve que la réponse est la vôtre. Ce navigateur s&apos;en
            souvient déjà. Les personnes qui pilotent le texte peuvent le retrouver pour vous le renvoyer — elles peuvent donc
            aussi modifier votre réponse.
          </p>
        </div>
      </div>
    )
  }

  if (conflict) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold">{conflict}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-black/60">
          Nous n&apos;écrasons pas une réponse existante sur la foi d&apos;un nom. Deux cas :
        </p>
        <ul className="mt-3 space-y-3 text-[14px] leading-relaxed text-black/70">
          <li>
            <strong className="font-semibold">C&apos;est bien nous.</strong> Reprenez votre lien de signataire, affiché après
            votre première réponse, ou demandez-le aux personnes qui pilotent le texte.
          </li>
          <li>
            <strong className="font-semibold">C&apos;est une autre structure.</strong> Enregistrez quand même, les deux
            réponses coexisteront.
          </li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="btn-primary" disabled={busy} onClick={() => pending && submit(pending, true)}>
            Enregistrer comme une autre structure
          </button>
          <button className="btn-ghost" onClick={() => setConflict('')}>Corriger le nom</button>
        </div>
      </div>
    )
  }

  const outdated = own && own.version < version

  return (
    <form id="signer" className="card scroll-mt-6 p-6" onSubmit={onSubmit} onChange={() => setEnvoye(false)} key={own ? 'edit' : 'new'}>
      <h2 className="text-lg font-semibold">{own ? 'Modifier notre réponse' : 'Je signe'}</h2>
      {own ? (
        <p className={`mt-1.5 rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed ${outdated ? 'bg-rose' : 'bg-wall text-black/60'}`}>
          {outdated
            ? `Vous aviez répondu sur la version ${own.version}. Le texte a changé : relisez-le et revalidez.`
            : `Votre réponse est à jour (version ${own.version}).`}
        </p>
      ) : (
        <p className="mt-1 text-[12.5px] text-black/50">
          Sans compte : à la fin, vous recevez un lien de signataire pour modifier ou revalider plus tard.
        </p>
      )}

      <div className="mt-4 space-y-2">
        {STANCES.map((v) => (
          <label key={v} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-2.5 text-[14px] transition ${
            stance === v ? 'border-violet bg-violet-wash' : 'border-black/10 hover:border-black/20'
          }`}>
            <input type="radio" name="stance-ui" className="mt-1 accent-[#4B2AEF]" checked={stance === v} onChange={() => setStance(v)} />
            <span>{STANCE_LABEL[v]}</span>
          </label>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <label className="label" htmlFor="name">Nom de l’organisation ou de la personne</label>
          <input id="name" name="name" className="field" required defaultValue={own?.name ?? ''} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="role">Fonction</label>
            <input id="role" name="role" className="field" placeholder="optionnel" defaultValue={own?.role ?? ''} />
          </div>
          <div>
            <label className="label" htmlFor="city">Ville</label>
            <input id="city" name="city" className="field" placeholder="optionnel" defaultValue={own?.city ?? ''} />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="email">Email de contact <span className="text-black/35">(jamais publié)</span></label>
          <input id="email" name="email" type="email" className="field" defaultValue={own?.email ?? ''} />
        </div>
        <div>
          <label className="label" htmlFor="note">Un mot à ajouter</label>
          <input id="note" name="note" className="field" placeholder="optionnel" defaultValue={own?.note ?? ''} />
        </div>
        <label className="btn-dark w-full cursor-pointer text-[14px]">
          {logo ? logo.name : own?.logo_url ? 'Remplacer notre logo' : 'Charger votre logo en JPEG ou PNG'}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only"
            onChange={(e) => choisirLogo(e.target.files?.[0] ?? null)} />
        </label>
        {logoMsg && <p className="rounded-xl bg-wall px-3 py-2 text-[13px]">{logoMsg}</p>}
        <p className="text-[12px] text-black/45">
          Optionnel. PNG, JPEG, WebP ou SVG, 2 Mo maximum (un logo plus lourd est réduit automatiquement).
          Il apparaîtra avec votre signature sur le visuel final : inutile de l&apos;envoyer en plus par mail.
        </p>
      </div>

      {err && <p className="mt-4 rounded-xl bg-rose px-4 py-3 text-[14px]">{err}</p>}
      <button className="btn-primary mt-5 w-full disabled:cursor-default disabled:opacity-50" disabled={busy || envoye}>
        {busy ? 'Envoi…' : envoye ? 'Réponse enregistrée ✓' : own ? 'Mettre à jour notre réponse' : 'Valider ma réponse'}
      </button>
    </form>
  )
}

function Signatories({ list, version }: { list: Signatory[]; version: number }) {
  const shown = list.filter((s) => s.stance !== 'non')
  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold">Premiers signataires</h2>
      <p className="mt-1 text-[12.5px] text-black/45">Le repère « v2 » signale un accord donné sur une version antérieure du texte.</p>
      {shown.length === 0 && <p className="mt-2 text-[14px] text-black/55">Personne n&apos;a encore répondu. À vous de commencer.</p>}
      <ul className="mt-4 space-y-3">
        {shown.map((s) => (
          <li key={s.id} className="flex items-center gap-3">
            {s.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.logo_url} alt="" className="h-9 w-9 shrink-0 rounded-lg object-contain" />
            ) : (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-wash text-[13px] font-semibold text-violet">
                {s.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-medium">{s.name}</span>
              <span className="block truncate text-[12.5px] text-black/50">
                {[s.role, s.city].filter(Boolean).join(' · ') || STANCE_SHORT[s.stance]}
              </span>
            </span>
            {hasSigned(s) && s.version < version && (
              <span className="ml-auto shrink-0 rounded-full bg-wall px-2 py-0.5 text-[11.5px] text-black/50" title={`A signé la version ${s.version}`}>
                v{s.version}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Empty({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-2xl px-5 pt-8">
      <Wordmark size="sm" />
      <div className="card mt-6 p-9 text-[15px] text-black/60">{message}</div>
    </main>
  )
}

const LOGO_MAX = 2 * 1024 * 1024 // même limite que l'API
const mo = (n: number) => `${(n / 1024 / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`

// Redessine l'image en plus petit : PNG d'abord (transparence gardée), puis JPEG sur fond blanc si ça ne suffit pas.
async function reduireLogo(f: File): Promise<File> {
  if (f.type === 'image/svg+xml') throw new Error('svg')
  const img = await createImageBitmap(f)
  const types = f.type === 'image/png' ? ['image/png', 'image/jpeg'] : ['image/jpeg']
  for (const type of types)
    for (const cote of [1600, 1200, 800, 600]) {
      const k = Math.min(1, cote / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
      const g = c.getContext('2d')!
      if (type === 'image/jpeg') { g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height) }
      g.drawImage(img, 0, 0, c.width, c.height)
      const blob = await new Promise<Blob | null>((ok) => c.toBlob(ok, type, 0.88))
      if (blob && blob.size <= LOGO_MAX) return new File([blob], f.name.replace(/\.\w+$/, type === 'image/png' ? '.png' : '.jpg'), { type })
    }
  throw new Error('trop lourd')
}

// Crayon des signataires (16/10/2026) : il ouvre « Proposer un autre titre », validé ensuite par qui pilote.
function TitrePublic({ titre, ouvert, onProposer }: { titre: string; ouvert: boolean; onProposer: () => void }) {
  return (
    <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
      {titre}
      {ouvert && <BoutonCrayon label="Proposer un autre titre" onClick={onProposer} />}
    </h1>
  )
}

function BoutonCrayon({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label}
      className="ml-3 inline-flex h-8 w-8 translate-y-[-4px] items-center justify-center rounded-lg align-middle text-black/35 hover:bg-black/5 hover:text-violet">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    </button>
  )
}

// Petit crayon à côté du titre pour qui pilote le texte : modification directe (16/10/2026, demandé par Ste).
function TitrePilote({ slug, k, titre, onSaved }: { slug: string; k: string; titre: string; onSaved: () => void }) {
  const [edition, setEdition] = useState(false)
  const [v, setV] = useState(titre)
  const [erreur, setErreur] = useState('')
  async function enregistrer() {
    const t = v.trim()
    if (!t || t === titre) { setV(titre); setEdition(false); return }
    const res = await fetch(`/api/appeals/${slug}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ k, title: t }),
    })
    if (!res.ok) { setErreur((await res.json().catch(() => ({}))).error ?? 'Enregistrement impossible.'); return }
    setEdition(false)
    onSaved()
  }
  const style = 'text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl'
  if (!edition) {
    return (
      <h1 className={style}>
        {titre}
        <BoutonCrayon label="Modifier le titre" onClick={() => setEdition(true)} />
      </h1>
    )
  }
  return (
    <div>
      <input autoFocus aria-label="Titre du texte" value={v} onChange={(e) => { setV(e.target.value); setErreur('') }}
        onBlur={enregistrer}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') { setV(titre); setEdition(false) } }}
        className={`-mx-2 w-full rounded-lg border border-violet bg-transparent px-2 py-1 focus:outline-none ${style}`} />
      <p className="mt-1 text-[12.5px] text-black/45">{erreur || 'Entrée pour enregistrer, Échap pour annuler.'}</p>
    </div>
  )
}
