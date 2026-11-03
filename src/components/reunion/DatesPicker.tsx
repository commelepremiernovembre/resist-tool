'use client'

import { useRef, useState } from 'react'

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const JOURS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di']
const pad = (n: number) => String(n).padStart(2, '0')
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

/** Calendrier : un appui choisit ou retire une date, glisser en sélectionne plusieurs d'un coup. */
export function DatesPicker({ value, onChange }: { value: string[]; onChange: (dates: string[]) => void }) {
  const now = new Date()
  const first = value.length ? new Date(`${[...value].sort()[0]}T12:00:00`) : now
  const [y, setY] = useState(first.getFullYear())
  const [m, setM] = useState(first.getMonth())
  const drag = useRef<{ add: boolean; seen: Set<string> } | null>(null)
  const today = iso(now.getFullYear(), now.getMonth(), now.getDate())

  const offset = (new Date(y, m, 1).getDay() + 6) % 7
  const days = new Date(y, m + 1, 0).getDate()
  const cells: (string | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => iso(y, m, i + 1))]
  while (cells.length % 7) cells.push(null)

  const set = new Set(value)
  const apply = (d: string) => {
    const g = drag.current
    if (!g || g.seen.has(d) || d < today) return
    g.seen.add(d)
    const next = new Set(set)
    g.add ? next.add(d) : next.delete(d)
    onChange([...next].sort())
  }
  const move = (delta: number) => {
    const d = new Date(y, m + delta, 1)
    setY(d.getFullYear()); setM(d.getMonth())
  }
  const at = (e: React.PointerEvent) =>
    (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest<HTMLElement>('[data-date]')?.dataset.date

  return (
    <div className="mx-auto w-full max-w-[300px] select-none rounded-2xl border border-black/10 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-1">
        <button type="button" className="grid h-9 w-9 place-items-center rounded-full hover:bg-violet-wash" onClick={() => move(-1)} aria-label="Mois précédent">‹</button>
        <div className="flex gap-1">
          <select className="rounded-lg border border-black/10 px-1.5 py-1 text-[13px]" value={m} onChange={(e) => setM(Number(e.target.value))} aria-label="Mois">
            {MOIS.map((n, i) => <option key={n} value={i}>{n}</option>)}
          </select>
          <select className="rounded-lg border border-black/10 px-1.5 py-1 text-[13px]" value={y} onChange={(e) => setY(Number(e.target.value))} aria-label="Année">
            {[0, 1, 2].map((k) => <option key={k} value={now.getFullYear() + k}>{now.getFullYear() + k}</option>)}
          </select>
        </div>
        <button type="button" className="grid h-9 w-9 place-items-center rounded-full hover:bg-violet-wash" onClick={() => move(1)} aria-label="Mois suivant">›</button>
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] text-black/45">
        {JOURS.map((j) => <div key={j} className="py-1">{j}</div>)}
      </div>
      <div
        className="grid touch-none grid-cols-7 gap-0.5"
        onPointerDown={(e) => {
          const d = at(e)
          if (!d || d < today) return
          ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
          drag.current = { add: !set.has(d), seen: new Set() }
          apply(d)
        }}
        onPointerMove={(e) => { if (drag.current) { const d = at(e); if (d) apply(d) } }}
        onPointerUp={() => { drag.current = null }}
        onPointerCancel={() => { drag.current = null }}
      >
        {cells.map((d, i) =>
          d ? (
            <div
              key={d}
              data-date={d}
              role="checkbox"
              aria-checked={set.has(d)}
              aria-label={new Date(`${d}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              tabIndex={d < today ? -1 : 0}
              onKeyDown={(e) => {
                if (e.key !== ' ' && e.key !== 'Enter') return
                e.preventDefault()
                const next = new Set(set); set.has(d) ? next.delete(d) : next.add(d); onChange([...next].sort())
              }}
              className={`grid h-9 cursor-pointer place-items-center rounded-lg text-[13.5px] transition ${
                d < today ? 'cursor-default text-black/20' : set.has(d) ? 'bg-violet font-semibold text-white' : 'hover:bg-violet-wash'
              }`}
            >
              {Number(d.slice(8))}
            </div>
          ) : <div key={`v${i}`} />,
        )}
      </div>
    </div>
  )
}
