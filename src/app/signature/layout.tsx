import type { Metadata } from 'next'

// Nom de l'onglet pour l'outil Textes ; ambiance bleue (voir .amb-textes dans globals.css).
export const metadata: Metadata = { title: 'Resist ! Textes', icons: { icon: '/icon-textes.png' } }

export default function TextesLayout({ children }: { children: React.ReactNode }) {
  return <div className="amb-textes">{children}</div>
}
