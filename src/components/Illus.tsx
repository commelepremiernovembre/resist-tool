// Vignettes dessinées : une signature, une grille de dates.
// Pas de photos : rien à héberger, rien à créditer, et ça reste lisible en petit.

export function IllusSignature() {
  return (
    <svg viewBox="0 0 320 140" className="h-full w-full" role="img" aria-label="Une signature tracée à la main">
      {/* Rose de Paraphe (#DB1A74), comme l'orange de Réunion. */}
      <rect width="320" height="140" fill="#FDE8F2" />
      <path d="M60 96c22-46 34-62 44-60 9 2 3 26-8 44-11 18-22 26-27 22-6-5 6-22 34-30 30-8 66-6 96 4"
        fill="none" stroke="#DB1A74" strokeWidth="4.5" strokeLinecap="round" />
      <rect x="228" y="86" width="58" height="12" rx="6" transform="rotate(-24 228 86)" fill="#0E0E12" />
    </svg>
  )
}

export function IllusReunion() {
  const cells = Array.from({ length: 21 })
  return (
    <svg viewBox="0 0 320 140" className="h-full w-full" role="img" aria-label="Une grille de disponibilités">
      <rect width="320" height="140" fill="#FDFBE6" />
      {cells.map((_, i) => {
        const x = 44 + (i % 7) * 34
        const y = 30 + Math.floor(i / 7) * 28
        const on = [3, 4, 10, 11, 12, 17, 18].includes(i)
        return <rect key={i} x={x} y={y} width="26" height="20" rx="4" fill={on ? '#FF7A00' : '#FFFFFF'} opacity={on ? 1 : 0.75} />
      })}
      <rect x="146" y="24" width="26" height="90" rx="6" fill="none" stroke="#0E0E12" strokeWidth="3" />
    </svg>
  )
}

export function IllusPetition() {
  // Des pétitions reçues en vrac (bulles de messages) qui finissent rangées et signées.
  return (
    <svg viewBox="0 0 320 140" className="h-full w-full" role="img" aria-label="Des pétitions reçues par message, signées d'un coup">
      <rect width="320" height="140" fill="#E5F1FF" />
      <g fill="#FFFFFF" stroke="#1A7CF0" strokeWidth="3" strokeLinejoin="round">
        <path d="M44 34h56a8 8 0 0 1 8 8v18a8 8 0 0 1-8 8H62l-12 10v-10h-6a8 8 0 0 1-8-8V42a8 8 0 0 1 8-8z" />
        <path d="M58 84h44a8 8 0 0 1 8 8v12a8 8 0 0 1-8 8H70l-10 8v-8h-2a8 8 0 0 1-8-8V92a8 8 0 0 1 8-8z" />
      </g>
      <path d="M50 48h44M50 56h30M62 98h34" stroke="#1A7CF0" strokeWidth="3" strokeLinecap="round" />
      <path d="M122 70h22m-8-8l8 8-8 8" fill="none" stroke="#0E0E12" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="170" y="30" width="78" height="96" rx="6" fill="#FFFFFF" stroke="#0E0E12" strokeWidth="3" transform="rotate(6 209 78)" />
      <rect x="160" y="24" width="78" height="96" rx="6" fill="#FFFFFF" stroke="#0E0E12" strokeWidth="3" />
      <path d="M172 42h54M172 52h54M172 62h36" stroke="#0E0E12" strokeWidth="3" strokeLinecap="round" opacity=".35" />
      <path d="M172 96c8-10 12-12 14-8s-4 8 2 6 8-8 12-6 2 6 8 4" fill="none" stroke="#0E0E12" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="240" cy="110" r="17" fill="#0E0E12" />
      <path d="M231 110l6 6 12-13" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
