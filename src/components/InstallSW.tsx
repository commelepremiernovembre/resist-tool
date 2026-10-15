'use client'

import { useEffect } from 'react'

/** Enregistre le service worker : Resist s'installe comme une app et apparaît dans le menu Partager. */
export function InstallSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})
  }, [])
  return null
}
