import Link from 'next/link'
import { Wordmark } from '@/components/Wordmark'

export default function Soutenir() {
  return (
    <main className="mx-auto max-w-2xl px-5 pb-24 pt-8">
      <Wordmark size="sm" />
      <div className="card mt-6 p-9">
        <h1 className="text-2xl font-semibold tracking-tight">Donner un peu d&apos;argent</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-black/60">
          Les outils tournent sur un hébergement payé au mois. Branchez ici un lien HelloAsso, Liberapay ou Stripe :
          rien n&apos;est encore connecté.
        </p>
        <Link className="btn-ghost mt-6" href="/">Retour aux outils</Link>
      </div>
    </main>
  )
}
