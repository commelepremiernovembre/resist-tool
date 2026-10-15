import { db, slugify, token, json, bad } from '@/lib/db'

export async function POST(req: Request) {
  const b = await req.json().catch(() => null)
  if (!b?.title?.trim() || !b?.body?.trim()) return bad('Il faut au minimum un titre et un texte.')

  const body = b.body.trim()
  const { data, error } = await db
    .from('appeals')
    .insert({
      slug: slugify(b.title),
      admin_key: token(16),
      title: b.title.trim(),
      body,
      intro: b.intro?.trim() || null,
      deadline: b.deadline || null,
      contact: b.contact?.trim() || null,
      porteur: b.porteur?.trim().slice(0, 120) || null,
    })
    .select('id, slug, admin_key')
    .single()

  if (error || !data) return bad(error?.message ?? 'Création impossible.', 500)

  await db.from('appeal_versions').insert({
    appeal_id: data.id,
    number: 1,
    body,
    note: 'Version initiale',
  })

  return json({ slug: data.slug, admin_key: data.admin_key }, 201)
}
