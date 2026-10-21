'use client'

import { stat } from '@/lib/stat'
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
    stat('Texte créé')
    setDone(data)
    noter({ type: 'pilote', slug: data.slug, titre: form.title.trim(), k: data.admin_key }, true)
  }

  if (done) {
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    const pub = `${base}/signature/${done.slug}`
    const admin = `${pub}/pilote?k=${done.admin_key}`
    return (
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight">Le texte est en ligne</h1>
        <LinkBox label="Lien vers la page publique" href={pub} />
        <LinkBox label="Lien de pilotage (à retrouver dans Mon Espace)" href={admin} tone="dark" />
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a className="btn-primary" href={`${pub}#signer`}>Signer ce texte maintenant</a>
          <span className="text-[13px] text-black/50">Votre organisation peut être la première signataire.</span>
        </div>
        <div className="mt-4">
          <a className="btn border border-black/20 bg-white px-5 text-[15px]" href="/espace">Mon espace</a>
        </div>
      </Shell>
    )
  }

  return (
    <Shell titre="Un texte à signer ?" chapeau="Collez le texte, partagez le lien. Les organisations répondent, proposent des modifs et déposent leur logo au même endroit.">
      <div className="space-y-5">
        <div>
          <label className="label" htmlFor="title">Titre de l&apos;appel</label>
          <input id="title" className="field" value={form.title} onChange={set('title')} placeholder="Tribune contre…" />
        </div>
        <div>
          <label className="label" htmlFor="intro">Une phrase de contexte <span className="text-black/35">(optionnel)</span></label>
          <input id="intro" className="field" value={form.intro} onChange={set('intro')} placeholder="Ajouter un sous-titre" />
        </div>
        <div>
          <label className="label" htmlFor="body">Le texte</label>
          <AutoTextarea id="body" className="field min-h-[280px] leading-relaxed" value={form.body} onChange={set('body')}
            placeholder="Chèr.e.s camarades…" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="deadline">Date limite de signature <span className="text-black/35">(optionnel)</span></label>
            <input id="deadline" type="date" className="field" value={form.deadline} onChange={set('deadline')} />
          </div>
        </div>

        {/* 16/10/2026 : organisation et contact regroupés (Laurene les confondait) ; placés en fin de formulaire. */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="porteur">Nom de l&apos;organisation</label>
            <input id="porteur" className="field" value={form.porteur} onChange={set('porteur')} placeholder="Nom ou pseudo" />
          </div>
          <div>
            <label className="label" htmlFor="contact">Contact <span className="text-black/35">(optionnel)</span></label>
            <input id="contact" className="field" value={form.contact} onChange={set('contact')} placeholder="Email, téléphone, Signal…" />
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
function Shell({ titre, chapeau, children }: { titre?: string; chapeau?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-8">
      <Wordmark size="sm" />
      {titre && (
        <h1 className="mt-10 text-balance text-center font-display text-4xl font-extrabold tracking-tight text-violet sm:text-6xl">{titre}</h1>
      )}
      {chapeau && <p className="mx-auto mt-6 max-w-xl text-center text-[15px] text-black/50">{chapeau}</p>}
      <div className={`${titre ? 'mt-8 bg-violet-wash' : 'card mt-6'} rounded-3xl p-6 sm:p-9`}>{children}</div>
    </main>
  )
}
