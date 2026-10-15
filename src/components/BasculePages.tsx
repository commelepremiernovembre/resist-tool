import Link from 'next/link'

// À côté du logo, pour qui pilote le texte : « Page pilotage » / « Page publique ».
// Le bouton plein mène à l'autre page ; celui de la page où l'on est reste en contour.
export function BasculePages({ slug, k, ici }: { slug: string; k: string; ici: 'pilote' | 'publique' }) {
  const plein = 'rounded-lg border-2 border-violet bg-violet px-4 py-1.5 text-[13.5px] font-semibold text-white hover:bg-violet-dark'
  const contour = 'rounded-lg border-2 border-violet bg-white px-4 py-1.5 text-[13.5px] font-semibold text-violet'
  return (
    <div className="flex flex-wrap gap-2">
      {ici === 'pilote'
        ? <span className={contour} aria-current="page">Page pilotage</span>
        : <Link className={plein} href={`/signature/${slug}/pilote?k=${k}`}>Page pilotage</Link>}
      {ici === 'publique'
        ? <span className={contour} aria-current="page">Page publique</span>
        : <Link className={plein} href={`/signature/${slug}`}>Page publique</Link>}
    </div>
  )
}
