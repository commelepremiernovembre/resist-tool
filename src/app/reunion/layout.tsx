import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Resist ! Réunion', icons: { icon: '/icon-reunion.png' } }

// Ambiance Réunion : le violet de Resist devient jaune orangé sur ces pages (voir .amb-reunion dans globals.css).
export default function ReunionLayout({ children }: { children: React.ReactNode }) {
  return <div className="amb-reunion">{children}</div>
}
