'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Wordmark } from '@/components/Wordmark'

/** Barre du haut des pages Réunion : Resist ! à gauche (retour au menu), Inviter et nouveau sondage à droite. */
export function Haut({ invite = true }: { invite?: boolean }) {
  const [copied, setCopied] = useState(false)
  async function inviter() {
    const url = window.location.href.split('?')[0].replace(/\/modifier$/, '')
    if (navigator.share) {
      try { await navigator.share({ title: document.title, url }); return } catch { /* annulé : on copie */ }
    }
    await navigator.clipboard.writeText(url)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-3">
      <Wordmark size="sm" />
      <div className="flex items-center justify-end gap-1.5 sm:gap-2">
        {invite && (
          <button className="whitespace-nowrap rounded-full border-2 border-[#FF7A00] px-3.5 py-2 text-[14px] font-medium text-[#FF7A00] hover:bg-[#FDFBE6] sm:px-5 sm:text-[16px]" onClick={inviter}>
            <span aria-hidden>➦</span> {copied ? 'Lien copié' : 'Inviter'}
          </button>
        )}
        {/* Maquette de LOX : pilule orange « + Créer un nouveau sondage de date ». */}
        <Link href="/reunion/nouveau" className="whitespace-nowrap rounded-full border-2 border-[#FF7A00] bg-[#FF7A00] px-3.5 py-2 text-[14px] font-medium text-white hover:border-[#E86A00] hover:bg-[#E86A00] sm:px-5 sm:text-[16px]">+ Créer un nouveau sondage de date</Link>
      </div>
    </div>
  )
}
