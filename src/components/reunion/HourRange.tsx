'use client'

const h = (n: number) => `${String(n).padStart(2, '0')}:00`

/** Début / fin de la plage horaire : deux menus et un double curseur, synchronisés. */
export function HourRange({ from, to, onChange }: { from: number; to: number; onChange: (from: number, to: number) => void }) {
  const left = (from / 24) * 100
  const right = 100 - (to / 24) * 100
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3">
        <label className="flex items-center gap-2 text-[15px] font-medium">
          Début
          <select className="rounded-lg border border-black/10 bg-white px-2 py-1 text-[13px]" value={from}
            onChange={(e) => onChange(Number(e.target.value), to)}>
            {Array.from({ length: 24 }, (_, i) => i).filter((i) => i < to).map((i) => <option key={i} value={i}>{h(i)}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-[15px] font-medium">
          Fin
          <select className="rounded-lg border border-black/10 bg-white px-2 py-1 text-[13px]" value={to}
            onChange={(e) => onChange(from, Number(e.target.value))}>
            {Array.from({ length: 24 }, (_, i) => i + 1).filter((i) => i > from).map((i) => <option key={i} value={i}>{i === 24 ? 'minuit' : h(i)}</option>)}
          </select>
        </label>
      </div>

      <div className="px-1">
        <div className="relative h-6">
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-black/10" />
          <div className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-violet" style={{ left: `${left}%`, right: `${right}%` }} />
          <input type="range" min={0} max={24} step={1} value={from} aria-label="Heure de début"
            onChange={(e) => onChange(Math.min(Number(e.target.value), to - 1), to)} className="range-thumb" />
          <input type="range" min={0} max={24} step={1} value={to} aria-label="Heure de fin"
            onChange={(e) => onChange(from, Math.max(Number(e.target.value), from + 1))} className="range-thumb" />
        </div>
        <div className="mt-2 flex justify-between text-[13px]">
          <span className="text-black/35">0 h</span>
          <span className="font-semibold text-violet">{h(from)} → {to === 24 ? 'minuit' : h(to)}</span>
          <span className="text-black/35">24 h</span>
        </div>
      </div>
    </div>
  )
}
