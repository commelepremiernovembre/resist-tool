import { db, json, bad } from '@/lib/db'
import { cleanPoll } from '../_valid'
import { expire } from '@/lib/duree'

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const { data: poll } = await db
    .from('polls')
    .select('id, slug, title, dates, earliest, latest, timezone, event_url, vues, created_at')
    .eq('slug', params.slug)
    .single()
  if (!poll || expire(poll.created_at)) return bad('Ce sondage n’existe pas ou a été effacé (un lien dure 180 jours).', 404)
  if (!poll.dates) return bad('Ce sondage a été créé avec l’ancienne version de Réunion : créez-en un nouveau.', 410)

  const { data: votes } = await db
    .from('poll_votes')
    .select('id, name, slots, prefs, updated_at')
    .eq('poll_id', poll.id)
    .not('name_key', 'is', null)
    .order('created_at', { ascending: true })

  const { id, ...pub } = poll
  return json({ poll: pub, dispos: votes ?? [] })
}

/** Modifier le sondage : titre, dates, plage horaire. Les dispos déjà saisies sont gardées. */
export async function PATCH(req: Request, { params }: { params: { slug: string } }) {
  const c = cleanPoll(await req.json().catch(() => null))
  if (!c.ok) return bad(c.error)
  const { data, error } = await db.from('polls').update(c.value).eq('slug', params.slug).select('slug').single()
  if (error || !data) return bad(error?.message ?? 'Introuvable.', error ? 500 : 404)
  return json({ slug: data.slug })
}
