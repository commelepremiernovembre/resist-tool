import { LienOutil } from '@/components/LienOutil'
import { Wordmark } from '@/components/Wordmark'
import { IllusSignature, IllusReunion, IllusPetition } from '@/components/Illus'

const tools = [
  {
    title: 'Signature Texte',
    text: <>Partager votre texte, recevoir les modifs suggérées, les signatures et les logos signataires <strong className="font-semibold text-ink">sans que ce soit relou.</strong></>,
    cta: 'Créer un texte à signer',
    href: '/signature/nouveau',
    illus: <IllusPetition />,
  },
  {
    title: 'Sondage Réunion',
    text: <>Qui est dispo ? À quelles dates ? À quelle heure ? En Visio ou IRL ? Découvrez-le <strong className="font-semibold text-ink">sans que ce soit relou.</strong></>,
    cta: 'Créer un sondage de date',
    href: '/reunion/nouveau',
    illus: <IllusReunion />,
  },
  {
    title: 'Paraphe : Espace Pétition',
    text: <>J’ajoute les pétitions reçues dans mes messageries et je signe quand j’ai un moment de libre <strong className="font-semibold text-ink">sans que ce soit relou.</strong></>,
    cta: 'Découvrir l’appli',
    href: '/paraphe',
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
                <LienOutil href={t.href} className="btn-primary mt-4 w-full text-[14px]">{t.cta}</LienOutil>
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

      {/* Lien GitHub discret, horizontal en bas à gauche (les boutons Aa / A+ / EN sont à droite). */}
      <a
        href="https://github.com/commelepremiernovembre"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-3 left-3 z-40 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[12px] text-black/50 shadow-sm ring-1 ring-black/10 hover:text-black"
      >
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
        commelepremiernovembre
      </a>
    </main>
  )
}
