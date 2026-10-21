'use client'

import { useEffect } from 'react'
import { stat } from '@/lib/stat'

/** Arrivée depuis un texte retiré (?retire=slug, voir next.config.mjs) : on compte la visite puis on nettoie l'adresse. */
export function VisiteRetiree() {
  useEffect(() => {
    const u = new URL(window.location.href)
    const slug = u.searchParams.get('retire')
    if (!slug) return
    stat('Texte retiré visité', { texte: slug })
    u.searchParams.delete('retire')
    history.replaceState(null, '', u.pathname + u.search + u.hash)
  }, [])
  return null
}
