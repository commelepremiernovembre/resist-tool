'use client'

// Mon espace : tout ce qu'on a fait dans Resist, sur tous ses appareils, sans compte.
// Un code secret par personne (le même que le carnet Paraphe) ; l'ouvrir ailleurs relie l'appareil.

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Wordmark } from '@/components/Wordmark'
import { CODE, K_CODE, lireCache, monAppareil, monCode, noter, retires, synchroniser, type ElementEspace } from '@/lib/espace'

export default function MonEspace() {
  const [code, setCode] = useState('')
  const [items, setItems] = useState<ElementEspace[]>([])
  const [petitions, setPetitions] = useState<number | null>(null)
  const [etat, setEtat] = useState('')
  const [saisie, setSaisie] = useState('')
  const [copie, setCopie] = useState(false)

  async function charger() {
    setCode(monCode())
    setItems(lireCache())
    try {
      setItems(await synchroniser())
      setEtat('')
      noter({ type: 'appareil', slug: monAppareil(), titre: '' }, true)
      setItems(lireCache())
    } catch {
      setEtat('Hors ligne : affichage de ce que cet appareil connaît.')
    }
    fetch(`/paraphe/api/carnet?code=${monCode()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((b) => setPetitions(b ? (b.items || []).length : null))
      .catch(() => {})
  }

  // Textes signés sur cet appareil avant Mon espace : on les range aussi.
  async function rapatrier() {
    const deja = new Set([...lireCache().map((x) => x.id), ...retires()])
    for (let i = 0; i < localStorage.length; i++) {
      const cle = localStorage.key(i) || ''
      const m = cle.match(/^resist:signataire:(.+)$/)
      if (!m || deja.has('signe:' + m[1])) continue
      const s = localStorage.getItem(cle) || ''
      const r = await fetch(`/api/appeals/${m[1]}`, { cache: 'no-store' }).catch(() => null)
      const b = r && r.ok ? await r.json() : null
      if (b?.appeal) noter({ type: 'signe', slug: m[1], titre: b.appeal.title, s })
    }
  }

  // Relier : on prend le code d'un autre appareil, et ce qui est ici le rejoint.
  async function relier(c: string) {
    c = c.trim().toLowerCase().replace(/\s+/g, '')
    c = c.match(/[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}/)?.[0] || c // un lien collé marche aussi
    if (!CODE.test(c)) return setEtat('Ce code ne ressemble pas à un code personnel (xxxx-xxxx-xxxx).')
    const ici = lireCache()
    localStorage.setItem(K_CODE, c)
    setSaisie('')
    try {
      setItems(await synchroniser(ici))
      setEtat('Appareil relié : tout est réuni.')
    } catch {
      setEtat('Relié, mais la synchronisation a échoué. Réessayez plus tard.')
    }
    setCode(c)
    history.replaceState(null, '', '/espace')
    charger()
  }

  // Ranger dans l'historique (ou l'en ressortir) : rien n'est effacé, l'élément change juste de section.
  async function ranger(e: ElementEspace, historique: boolean) {
    const el = { ...e, historique, maj: new Date().toISOString() }
    setItems(items.map((x) => (x.id === e.id ? el : x)))
    try { setItems(await synchroniser([el])) } catch {}
  }

  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get('code')
    // Rapatrier après la synchro : il faut connaître les éléments déjà retirés.
    ;(c && c !== monCode() ? relier(c) : charger()).then(rapatrier).then(() => setItems(lireCache()))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const pilotesSlugs = new Set(items.filter((x) => x.type === 'pilote').map((x) => x.slug))
  const visibles = items.filter((x) => x.type !== 'appareil' && !(x.type === 'signe' && pilotesSlugs.has(x.slug)))
  // Chaque catégorie garde ses propres archives.
  const actifs = (t: string) => visibles.filter((x) => x.type === t && !x.historique)
  const archives = (t: string) => visibles.filter((x) => x.type === t && x.historique)
  const appareils = items.filter((x) => x.type === 'appareil').length

  return (
    <main className="amb-espace mx-auto max-w-3xl px-5 pb-24 pt-10">
      <Wordmark size="sm" />
      {/* Mon espace : fond gris de Resist, panneaux blancs (comme l’accueil). */}
      <h1 className="mt-10 text-center font-display text-4xl font-extrabold tracking-tight text-ink sm:text-6xl">Mon espace</h1>
      <p className="mt-6 text-center text-[15px] text-black/60">
        Vos textes, sondages et pétitions, sur tous vos appareils.<br />Sans compte : un code personnel suffit.
      </p>
      {etat && <p className="mt-3 rounded-xl bg-white px-3 py-2 text-[14px]">{etat}</p>}

      {/* Un panneau blanc par appli : Textes, Sondages, Pétitions. */}
      {([
        ['textes', [
          ['pilote', 'Textes que je pilote', "Aucun texte créé pour l'instant.", 'pilotage'],
          ['signe', "Textes que j'ai signés", "Aucun texte signé pour l'instant.", 'signé'],
        ]],
        ['reunion', [
          ['reunion', 'Sondages de date', "Aucun sondage pour l'instant.", undefined],
        ]],
      ] as const).map(([outil, sections]) => (
        <div key={outil} className="mt-6 rounded-3xl bg-white shadow-card px-5 pb-6 pt-1 sm:px-10">
          {sections.map(([t, titre, vide, note]) => (
            <Section key={t} outil={outil} titre={titre} vide={vide} archives={archives(t).map((e) => (
              <Ligne key={e.id} e={e} href={lien(e)} note={note} onRanger={ranger} />
            ))}>
              {actifs(t).map((e) => (
                <Ligne key={e.id} e={e} href={lien(e)} note={note} onRanger={ranger} />
              ))}
            </Section>
          ))}
        </div>
      ))}

      <div className="mt-6 rounded-3xl bg-white shadow-card px-5 pb-6 pt-1 sm:px-10">
        <TitreOutil outil="paraphe" titre="Pétitions" />
        <p className="mt-2 text-[14px] text-black/60">
          {petitions == null ? 'Elles sont rangées dans Paraphe.' : `${petitions} pétition${petitions > 1 ? 's' : ''} dans Paraphe.`}{' '}
          <a href="/paraphe" className="underline">Ouvrir Paraphe</a>
        </p>
      </div>

      {/* Replié dès que deux appareils sont reliés : on n'en a plus besoin tous les jours. */}
      <details key={appareils > 1 ? 'relie' : 'seul'} open={appareils < 2} className="mt-4 rounded-3xl bg-white shadow-card px-5 py-4 text-[13.5px] sm:px-8">
        <summary className="cursor-pointer text-black/60">
          {appareils > 1 ? `${appareils} appareils reliés — en relier un autre` : 'Retrouver tout ça sur un autre appareil'}
        </summary>
        <p className="mt-2 text-black/55">
          Copiez ce code, puis collez-le dans « Relier » sur l&apos;autre appareil (ou dans l&apos;app installée). Il donne accès à vos textes : ne le partagez pas.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-mono tracking-wider">{code}</span>
          <button className="rounded-lg border border-black/20 bg-white px-3 py-1" onClick={() => { navigator.clipboard.writeText(code); setCopie(true) }}>
            {copie ? 'Code copié' : 'Copier mon code'}
          </button>
        </div>
        <form className="mt-3 flex flex-wrap gap-2" onSubmit={(ev) => { ev.preventDefault(); relier(saisie) }}>
          <input className="w-48 rounded-lg border border-black/20 bg-white px-3 py-1" placeholder="Code d'un autre appareil" value={saisie}
            onChange={(ev) => setSaisie(ev.target.value)} autoCapitalize="none" autoCorrect="off" />
          <button className="rounded-lg border border-black/20 bg-white px-3 py-1">Relier</button>
        </form>
      </details>
    </main>
  )
}

// Chaque rubrique à la couleur de son outil, avec son icône R! : bleu Textes, orange Réunion, rose Paraphe.
const OUTILS = {
  textes: { couleur: '#1A7CF0', icone: '/icon-textes.png' },
  reunion: { couleur: '#FF7A00', icone: '/icon-reunion.png' },
  paraphe: { couleur: '#DB1A74', icone: '/icon-paraphe.png' },
} as const

function TitreOutil({ outil, titre }: { outil: keyof typeof OUTILS; titre: string }) {
  return (
    <h2 className="mt-6 flex items-center gap-2 text-[15px] font-semibold" style={{ color: OUTILS[outil].couleur }}>
      <img src={OUTILS[outil].icone} alt="" className="h-5 w-5 rounded-md" />
      {titre}
    </h2>
  )
}

function Section({ outil, titre, vide, archives, children }: { outil: keyof typeof OUTILS; titre: string; vide: string; archives: React.ReactNode[]; children: React.ReactNode[] }) {
  return (
    <>
      <TitreOutil outil={outil} titre={titre} />
      {children.length ? <ul className="mt-2 divide-y divide-black/[.07]">{children}</ul> : <p className="mt-2 text-[14px] text-black/45">{vide}</p>}
      {archives.length > 0 && (
        <details className="mt-1">
          <summary className="cursor-pointer py-1 text-[13px] text-black/50">Archivés ({archives.length})</summary>
          <ul className="divide-y divide-black/[.07] opacity-75">{archives}</ul>
        </details>
      )}
    </>
  )
}

function lien(e: ElementEspace) {
  if (e.type === 'pilote') return `/signature/${e.slug}/pilote?k=${e.k}`
  if (e.type === 'signe') return `/signature/${e.slug}?s=${e.s}`
  return `/reunion/${e.slug}`
}

function Ligne({ e, href, note, onRanger }: { e: ElementEspace; href: string; note?: string; onRanger: (e: ElementEspace, historique: boolean) => void }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <Link href={href} className="min-w-0 flex-1 truncate text-[15px] underline-offset-2 hover:underline">{e.titre || e.slug}</Link>
      {note && <span className="shrink-0 rounded-full bg-wall px-2 py-0.5 text-[12px] text-black/50">{note}</span>}
      <button className="shrink-0 text-[12.5px] text-black/40 hover:text-black" onClick={() => onRanger(e, !e.historique)}
        title={e.historique ? 'Restaurer dans ma liste' : "Archiver (rien n'est effacé)"}>
        {e.historique ? 'Restaurer' : 'Archiver'}
      </button>
    </li>
  )
}

