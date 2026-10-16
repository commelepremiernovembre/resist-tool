import { LienOutil } from '@/components/LienOutil'
import { Wordmark } from '@/components/Wordmark'
import { IllusSignature, IllusReunion, IllusPetition } from '@/components/Illus'

const tools = [
  {
    title: 'Signature Texte',
    text: <>Partager votre texte, recevoir les modifs suggérées, les signatures et les logos signataires <strong className="font-semibold text-ink">sans que ce soit relou.</strong></>,
    cta: 'Créer un texte à signer',
    href: '/signature/nouveau',
    couleur: '#402AE6',
    illus: <IllusPetition />,
  },
  {
    title: 'Sondage Réunion',
    text: <>Qui est dispo ? À quelles dates ? À quelle heure ? En Visio ou IRL ? Découvrez-le <strong className="font-semibold text-ink">sans que ce soit relou.</strong></>,
    cta: 'Créer un sondage de date',
    href: '/reunion/nouveau',
    couleur: '#FF7A00',
    illus: <IllusReunion />,
  },
  {
    title: 'Paraphe : Espace Pétition',
    text: <>J’ajoute les pétitions reçues dans mes messageries et je signe quand j’ai un moment de libre <strong className="font-semibold text-ink">sans que ce soit relou.</strong></>,
    cta: 'Découvrir l’appli',
    href: '/paraphe',
    couleur: '#B0279B',
    illus: <IllusSignature />,
  },
]


export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-5 pb-24 pt-10">
      <div className="card overflow-hidden px-5 py-12 sm:px-12 sm:py-16">
        <div className="text-center">
          <div className="inline-block text-left">
            <Wordmark />
          </div>
          <h1 className="mx-auto mt-9 max-w-2xl text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-[40px]">
            Outils simples et privés pour militer collectivement.
          </h1>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {tools.map((t) => (
            <article key={t.title} className="flex flex-col overflow-hidden rounded-2xl border border-black/[.07] bg-white">
              <div className="h-28">{t.illus}</div>
              <div className="flex flex-1 flex-col p-4">
                <h2 className="text-[15px] font-semibold">{t.title}</h2>
                <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-black/60">{t.text}</p>
                {/* Nouvel onglet dans le navigateur, même fenêtre dans l'app installée. */}
                <LienOutil href={t.href} className="btn-primary mt-4 w-full text-[14px] hover:brightness-90" style={{ backgroundColor: t.couleur }}>{t.cta}</LienOutil>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 text-center">
          <LienOutil href="/espace" className="btn border border-black/20 bg-white px-5 text-[15px]">Mon espace</LienOutil>
          <p className="mt-2 text-[13px] text-black/50">Vos textes, sondages et pétitions, sur tous vos appareils.</p>
        </div>
      </div>

      <p className="mx-auto mt-8 max-w-2xl text-center text-[13px] leading-relaxed text-black/45">
        100% gratuit et sans inscription.<br />
        Chaque page vit sur un lien secret, non indexé. Tout est effacé au bout de 6 mois sans activité, sauf les textes que vous mettez hors ligne pour les archiver.
      </p>

      {/* Lien GitHub retiré le 16/10 à la demande de Ste (« pour la cause, pas d’ego ») ; à remettre plus tard. */}
    </main>
  )
}
