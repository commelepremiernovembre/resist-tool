'use client'

import { useState } from 'react'
import { Wordmark } from '@/components/Wordmark'
import { AutoTextarea } from '@/components/AutoTextarea'
import { noter } from '@/lib/espace'

export default function NouveauTexte() {
  const [form, setForm] = useState({ title: '', porteur: '', intro: '', body: '', deadline: '', contact: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState<{ slug: string; admin_key: string } | null>(null)

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value })

  async function create() {
    setBusy(true)
    setErr('')
    const res = await fetch('/api/appeals', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) return setErr(data.error ?? 'Création impossible.')
    setDone(data)
    noter({ type: 'pilote', slug: data.slug, titre: form.title.trim(), k: data.admin_key }, true)
  }

  if (done) {
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    const pub = `${base}/signature/${done.slug}`
    const admin = `${pub}/pilote?k=${done.admin_key}`
    return (
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">Votre texte est en ligne.</h1>
        <p className="mt-2 text-[15px] text-black/60">
          Gardez ces deux liens : ils ne seront plus affichés. Le second donne le contrôle du texte, ne le diffusez pas. Dans 180 jours, le texte, les signatures et les logos seront effacés.
        </p>
        <LinkBox label="À faire circuler dans les organisations" href={pub} />
        <LinkBox label="Votre lien de pilotage (à garder)" href={admin} tone="dark" />
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a className="btn-primary" href={`${pub}#signer`}>Signer ce texte maintenant</a>
          <span className="text-[13px] text-black/50">Votre organisation peut être la première signataire.</span>
        </div>
      </Shell>
    )
  }

  return (
    <Shell titre="Un texte à signer ?">
      <p className="text-center text-[15px] text-black/60">
        Collez le texte, partagez le lien. Les organisations répondent, proposent des modifs et déposent leur logo au
        même endroit.
      </p>

      <div className="mt-8 space-y-5">
        <div>
          <label className="label" htmlFor="title">Titre de l&apos;appel</label>
          <input id="title" className="field" value={form.title} onChange={set('title')} placeholder="Tribune contre…" />
        </div>
        {/* 16/10/2026 : organisation et contact regroupés (Laurene les confondait). */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="porteur">Nom de l&apos;organisation</label>
            <input id="porteur" className="field" value={form.porteur} onChange={set('porteur')} placeholder="Organisation ou collectif" />
          </div>
          <div>
            <label className="label" htmlFor="contact">Contact <span className="text-black/35">(optionnel)</span></label>
            <input id="contact" className="field" value={form.contact} onChange={set('contact')} placeholder="email, téléphone, Signal…" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="intro">Une phrase de contexte <span className="text-black/35">(optionnel)</span></label>
          <input id="intro" className="field" value={form.intro} onChange={set('intro')} placeholder="Texte proposé par… à signer avant le…" />
        </div>
        <div>
          <label className="label" htmlFor="body">Le texte</label>
          <AutoTextarea id="body" className="field min-h-[280px] leading-relaxed" value={form.body} onChange={set('body')}
            placeholder="Un paragraphe par bloc. Laissez une ligne vide entre deux paragraphes." />
          <p className="mt-1.5 text-[12.5px] text-black/45">
            Chaque paragraphe devient annotable : les organisations pourront viser un passage précis.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="deadline">Date limite de signature <span className="text-black/35">(optionnel)</span></label>
            <input id="deadline" type="date" className="field" value={form.deadline} onChange={set('deadline')} />
          </div>
        </div>

        {err && <p className="rounded-xl bg-rose px-4 py-3 text-[14px]">{err}</p>}

        <button className="btn-primary" onClick={create} disabled={busy}>
          {busy ? 'Publication…' : 'Publier le texte'}
        </button>
      </div>
    </Shell>
  )
}

function LinkBox({ label, href, tone = 'light' }: { label: string; href: string; tone?: 'light' | 'dark' }) {
  return (
    <div className={`mt-5 rounded-2xl p-4 ${tone === 'dark' ? 'bg-ink text-white' : 'bg-violet-wash'}`}>
      <p className={`text-[12.5px] font-medium ${tone === 'dark' ? 'text-white/60' : 'text-violet-dark'}`}>{label}</p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <code className="break-all text-[13px]">{href}</code>
        <button
          className={`btn px-4 py-2 text-[13px] ${tone === 'dark' ? 'bg-white text-ink' : 'bg-violet text-white'}`}
          onClick={() => navigator.clipboard.writeText(href)}
        >
          Copier
        </button>
      </div>
    </div>
  )
}

// Même allure que la création d'un sondage : grand titre à la couleur de l'outil, panneau bleu pâle sur fond blanc.
function Shell({ titre, children }: { titre?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-8">
      <Wordmark size="sm" />
      {titre && (
        <h1 className="mt-10 text-balance text-center font-display text-4xl font-extrabold tracking-tight text-violet sm:text-6xl">{titre}</h1>
      )}
      <div className={`${titre ? 'mt-8 bg-violet-wash' : 'card mt-6'} rounded-3xl p-6 sm:p-9`}>{children}</div>
    </main>
  )
}
