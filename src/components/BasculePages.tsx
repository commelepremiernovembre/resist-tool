import Link from 'next/link'

// À côté du logo, pour qui pilote le texte : « Page pilotage » / « Page publique ».
// La page où l'on est : bouton plein ; l'autre page : bouton en contour (lien).
export function BasculePages({ slug, k, ici }: { slug: string; k: string; ici: 'pilote' | 'publique' }) {
  const plein = 'rounded-lg border-2 border-violet bg-violet px-4 py-1.5 text-[13.5px] font-semibold text-white'
  const contour = 'rounded-lg border-2 border-violet bg-white px-4 py-1.5 text-[13.5px] font-semibold text-violet hover:bg-violet/10'
  return (
    <div className="flex flex-wrap gap-2">
      {ici === 'pilote'
        ? <span className={plein} aria-current="page">Page pilotage</span>
        : <Link className={contour} href={`/signature/${slug}/pilote?k=${k}`}>Page pilotage</Link>}
      {ici === 'publique'
        ? <span className={plein} aria-current="page">Page publique</span>
        : <Link className={contour} href={`/signature/${slug}`}>Page publique</Link>}
    </div>
  )
}
