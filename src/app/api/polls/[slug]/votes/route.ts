import { db, json, bad } from '@/lib/db'
import { allSlots, nameKey } from '@/lib/reunion'

async function pollOf(slug: string) {
  const { data } = await db.from('polls').select('id, dates, earliest, latest').eq('slug', slug).single()
  return data?.dates ? data : null
}

/** Enregistre les dispos d'un pseudo. Le même pseudo remplace sa réponse précédente. */
export async function PUT(req: Request, { params }: { params: { slug: string } }) {
  const b = await req.json().catch(() => null)
  const name = String(b?.name ?? '').trim().slice(0, 60)
  if (!name) return bad('Il faut un pseudo.')
  const poll = await pollOf(params.slug)
  if (!poll) return bad('Introuvable.', 404)

  const valid = allSlots(poll)
  const slots = Array.isArray(b.slots) ? [...new Set<string>(b.slots.filter((s: unknown) => typeof s === 'string' && valid.has(s)))] : []
  const prefs = Array.isArray(b.prefs) ? b.prefs.filter((p: unknown) => p === 'presentiel' || p === 'visio') : []

  const row = { poll_id: poll.id, name, name_key: nameKey(name), slots, prefs, answers: {}, updated_at: new Date().toISOString() }
  const { error } = await db.from('poll_votes').upsert(row, { onConflict: 'poll_id,name_key' })
  if (error) return bad(error.message, 500)
  return json({ ok: true })
}

export async function DELETE(req: Request, { params }: { params: { slug: string } }) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return bad('Quel vote ?')
  const poll = await pollOf(params.slug)
  if (!poll) return bad('Introuvable.', 404)
  const { error } = await db.from('poll_votes').delete().eq('id', id).eq('poll_id', poll.id)
  if (error) return bad(error.message, 500)
  return json({ ok: true })
}
