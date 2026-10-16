'use client'

// Lien vers un outil depuis l'accueil : nouvel onglet dans le navigateur,
// même fenêtre dans l'app installée (PWA), où un onglet ouvrirait le navigateur à côté.

import { useEffect, useState } from 'react'

export function LienOutil({ href, className, style, children }: { href: string; className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  const [onglet, setOnglet] = useState(false)
  useEffect(() => {
    const appli = window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
    setOnglet(!appli)
  }, [])
  return <a href={href} className={className} style={style} {...(onglet ? { target: '_blank' } : {})}>{children}</a>
}
