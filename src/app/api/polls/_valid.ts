import { TIMEZONES } from '@/lib/reunion'

const DATE = /^\d{4}-\d{2}-\d{2}$/

/** Vérifie et nettoie les réglages d'un sondage (création ou modification). */
export function cleanPoll(b: any): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  const dates = Array.isArray(b?.dates) ? [...new Set<string>(b.dates.filter((d: unknown) => typeof d === 'string' && DATE.test(d)))].sort() : []
  if (!dates.length) return { ok: false, error: 'Choisissez au moins une date.' }
  if (dates.length > 62) return { ok: false, error: 'Deux mois de dates au maximum.' }
  const earliest = Number(b.earliest), latest = Number(b.latest)
  if (!Number.isInteger(earliest) || !Number.isInteger(latest) || earliest < 0 || latest > 24 || earliest >= latest)
    return { ok: false, error: 'La plage horaire est incorrecte.' }
  const timezone = TIMEZONES.some((t) => t.id === b.timezone) ? b.timezone : 'Europe/Paris'
  const title = String(b.title ?? '').trim().slice(0, 120) || 'Réunion'
  let event_url = String(b.event_url ?? '').trim().slice(0, 300) || null
  if (event_url && !/^https?:\/\//i.test(event_url)) event_url = `https://${event_url}`
  return { ok: true, value: { title, dates, earliest, latest, timezone, event_url } }
}
