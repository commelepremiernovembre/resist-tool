import { db, slugify, token, json, bad } from '@/lib/db'
import { cleanPoll } from './_valid'

export async function POST(req: Request) {
  const b = await req.json().catch(() => null)
  const c = cleanPoll(b)
  if (!c.ok) return bad(c.error)

  const { data: poll, error } = await db
    .from('polls')
    .insert({ ...c.value, slug: slugify(String(c.value.title)), admin_key: token(16) })
    .select('slug')
    .single()
  if (error || !poll) return bad(error?.message ?? 'Création impossible.', 500)
  return json({ slug: poll.slug }, 201)
}
