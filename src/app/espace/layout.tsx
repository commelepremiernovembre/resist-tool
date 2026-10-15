import type { Metadata } from 'next'

// Nom de l'onglet pour Mon espace.
export const metadata: Metadata = { title: 'Resist ! Mon espace' }

export default function EspaceLayout({ children }: { children: React.ReactNode }) {
  return children
}
