import { db, json, bad } from '@/lib/db'

export async function PATCH(req: Request, { params }: { params: { slug: string; id: string } }) {
  const b = await req.json().catch(() => null)
  const status = b?.status
  if (!['open', 'accepted', 'rejected'].includes(status)) return bad('Statut inconnu.')

  const { data: appeal } = await db.from('appeals').select('id, admin_key').eq('slug', params.slug).single()
  if (!appeal) return bad('Introuvable.', 404)
  if (b?.k !== appeal.admin_key) return bad('Clé de pilotage invalide.', 403)

  const { error } = await db.from('suggestions').update({ status }).eq('id', params.id).eq('appeal_id', appeal.id)
  if (error) return bad(error.message, 500)
  return json({ ok: true })
}
