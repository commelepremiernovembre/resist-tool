'use client'

import { useRef } from 'react'
import { dayShort, hhmm, key, rows, type Dispo } from '@/lib/reunion'

type Props = {
  dates: string[]
  earliest: number
  latest: number
  /** Saisie : les créneaux cochés par la personne. Absent = affichage des réponses. */
  mine?: Set<string>
  onMine?: (next: Set<string>) => void
  /** Affichage : les réponses retenues (cases cochées) et le créneau sous le doigt. */
  dispos?: Dispo[]
  focus?: string | null
  onFocus?: (slot: string | null) => void
}

/**
 * Grille jours × demi-heures. En saisie, on glisse le doigt ou la souris pour peindre
 * ses dispos (le premier créneau touché décide : on ajoute ou on retire).
 * En affichage, plus la case est foncée, plus il y a de monde.
 */
export function Grille({ dates, earliest, latest, mine, onMine, dispos = [], focus, onFocus }: Props) {
  const editing = !!mine
  const drag = useRef<{ add: boolean; base: Set<string>; start: [number, number] } | null>(null)
  const times = rows(earliest, latest)
  const sorted = [...dates].sort()

  const counts = new Map<string, number>()
  for (const v of dispos) for (const s of v.slots) counts.set(s, (counts.get(s) ?? 0) + 1)
  const total = dispos.length

  const cellAt = (e: React.PointerEvent) => {
    const el = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest<HTMLElement>('[data-c]')
    return el ? (el.dataset.c!.split(',').map(Number) as [number, number]) : null
  }
  // Glisser sélectionne le rectangle entre la case de départ et la case courante.
  const paint = (to: [number, number]) => {
    const g = drag.current
    if (!g || !onMine) return
    const next = new Set(g.base)
    const [c0, c1] = [Math.min(g.start[0], to[0]), Math.max(g.start[0], to[0])]
    const [r0, r1] = [Math.min(g.start[1], to[1]), Math.max(g.start[1], to[1])]
    for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) {
      const k = key(sorted[c], times[r])
      g.add ? next.add(k) : next.delete(k)
    }
    onMine(next)
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/10 bg-white">
      <div
        className={`inline-grid min-w-full select-none ${editing ? 'touch-none' : ''}`}
        style={{ gridTemplateColumns: `3.25rem repeat(${sorted.length}, minmax(3rem, 1fr))` }}
        onPointerDown={(e) => {
          const c = cellAt(e)
          if (!c) return
          if (!editing) return onFocus?.(key(sorted[c[0]], times[c[1]]))
          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
          drag.current = { add: !mine!.has(key(sorted[c[0]], times[c[1]])), base: new Set(mine), start: c }
          paint(c)
        }}
        onPointerMove={(e) => {
          const c = cellAt(e)
          if (drag.current) { if (c) paint(c) }
          else if (!editing && e.pointerType === 'mouse') onFocus?.(c ? key(sorted[c[0]], times[c[1]]) : null)
        }}
        onPointerUp={() => { drag.current = null }}
        onPointerCancel={() => { drag.current = null }}
        onPointerLeave={(e) => { if (!editing && e.pointerType === 'mouse') onFocus?.(null) }}
      >
        <div className="sticky left-0 z-10 border-b border-black/10 bg-white" />
        {sorted.map((d) => {
          const s = dayShort(d)
          return (
            <div key={d} className="border-b border-l border-black/10 px-1 py-2 text-center">
              <div className="text-[11px] uppercase tracking-wide text-black/50">{s.weekday}</div>
              <div className="text-[19px] leading-tight text-black/80">{s.day}</div>
              <div className="text-[10.5px] text-black/40">{s.month}</div>
            </div>
          )
        })}

        {times.map((t, r) => (
          <Row key={t} t={t} first={r === 0}>
            {sorted.map((d, c) => {
              const k = key(d, t)
              const n = counts.get(k) ?? 0
              const on = editing ? mine!.has(k) : false
              // Une heure sur deux sur fond gris, comme la maquette de LOX : on suit mieux les lignes.
              const bande = Math.floor((t - times[0]) / 60) % 2 === 1 ? 'rgba(14, 14, 18, .035)' : undefined
              const bg = editing
                ? on ? 'rgb(31 122 92)' : bande
                : n ? `rgba(255, 122, 0, ${0.12 + 0.88 * (n / Math.max(total, 1))})` : bande
              return (
                <div
                  key={k}
                  data-c={`${c},${r}`}
                  className={`h-6 border-l border-black/10 ${t % 60 === 0 ? 'border-t border-t-black/10' : 'border-t border-dashed border-t-black/[.07]'} ${
                    focus === k ? 'outline outline-2 -outline-offset-2 outline-ink' : ''
                  } ${editing ? 'cursor-pointer' : ''}`}
                  style={{ background: bg }}
                  title={editing ? undefined : `${n}/${total} dispo`}
                />
              )
            })}
          </Row>
        ))}
      </div>
    </div>
  )
}

function Row({ t, children }: { t: number; first?: boolean; children: React.ReactNode }) {
  return (
    <>
      <div className="sticky left-0 z-10 bg-white">
        {/* L'heure en haut de sa ligne, comme sur la maquette. */}
        {t % 60 === 0 && <span className="absolute right-1.5 top-1 text-[10.5px] leading-none text-black/45">{hhmm(t)}</span>}
      </div>
      {children}
    </>
  )
}
