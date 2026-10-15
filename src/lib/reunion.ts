// Réunion façon MeetingBrew (MIT, github.com/csaye/meetingbrew), réécrite pour Resist.
// Un créneau = une demi-heure, clé 'YYYY-MM-DD HH:mm' à l'heure locale de l'évènement.

export const STEP = 30

export type Pref = 'presentiel' | 'visio'
export const PREF_LABEL: Record<Pref, string> = { presentiel: 'Présentiel', visio: 'Visio' }

export type Reunion = {
  slug: string
  title: string
  dates: string[]
  earliest: number
  latest: number
  timezone: string
  event_url: string | null
  vues?: number
  created_at: string
}
export type Dispo = { id: string; name: string; slots: string[]; prefs: Pref[]; updated_at: string | null }

export const TIMEZONES: { id: string; label: string }[] = [
  { id: 'Europe/Paris', label: 'Bruxelles, Copenhague, Paris' },
  { id: 'Europe/London', label: 'Londres, Lisbonne' },
  { id: 'America/Martinique', label: 'Martinique, Guadeloupe' },
  { id: 'America/Cayenne', label: 'Guyane' },
  { id: 'Indian/Reunion', label: 'La Réunion' },
  { id: 'Indian/Mayotte', label: 'Mayotte' },
  { id: 'Pacific/Noumea', label: 'Nouméa' },
  { id: 'Pacific/Tahiti', label: 'Tahiti' },
  { id: 'America/Montreal', label: 'Montréal, New York' },
]
export const tzLabel = (id: string) => TIMEZONES.find((t) => t.id === id)?.label ?? id

const pad = (n: number) => String(n).padStart(2, '0')
export const hhmm = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`

/** Les débuts de créneaux d'une journée, en minutes depuis minuit. */
export function rows(earliest: number, latest: number) {
  const out: number[] = []
  for (let m = earliest * 60; m < latest * 60; m += STEP) out.push(m)
  return out
}

export const key = (date: string, minutes: number) => `${date} ${hhmm(minutes)}`

export function allSlots(r: Pick<Reunion, 'dates' | 'earliest' | 'latest'>) {
  const set = new Set<string>()
  for (const d of r.dates) for (const m of rows(r.earliest, r.latest)) set.add(key(d, m))
  return set
}

const asDate = (d: string) => new Date(`${d}T12:00:00Z`)
export const dayLong = (d: string) =>
  asDate(d).toLocaleDateString('fr-FR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
export const dayShort = (d: string) => ({
  weekday: asDate(d).toLocaleDateString('fr-FR', { timeZone: 'UTC', weekday: 'short' }).replace('.', ''),
  day: asDate(d).getUTCDate(),
  month: asDate(d).toLocaleDateString('fr-FR', { timeZone: 'UTC', month: 'short' }).replace('.', ''),
})

export type Range = { date: string; from: number; to: number; count: number }

/** Les créneaux qui réunissent le plus de monde, fusionnés en plages continues. */
export function best(r: Reunion, dispos: Dispo[]): { ranges: Range[]; count: number } {
  const counts = new Map<string, number>()
  for (const v of dispos) for (const s of v.slots) counts.set(s, (counts.get(s) ?? 0) + 1)
  const valid = allSlots(r)
  let max = 0
  for (const [s, c] of counts) if (valid.has(s) && c > max) max = c
  if (!max) return { ranges: [], count: 0 }

  const ranges: Range[] = []
  for (const d of [...r.dates].sort()) {
    let cur: Range | null = null
    for (const m of rows(r.earliest, r.latest)) {
      if (counts.get(key(d, m)) === max) {
        if (cur && cur.to === m) cur.to = m + STEP
        else { cur = { date: d, from: m, to: m + STEP, count: max }; ranges.push(cur) }
      } else cur = null
    }
  }
  return { ranges, count: max }
}

const heure = (m: number) => (m >= 1440 ? 'minuit' : hhmm(m))
export const rangeText = (x: Range) => `${dayLong(x.date)}, de ${heure(x.from)} à ${heure(x.to)}`

export function nameKey(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}
