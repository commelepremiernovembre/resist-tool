import { db, json, bad } from '@/lib/db'

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const b = await req.json().catch(() => null)
  if (!b?.author?.trim() || !b?.proposal?.trim()) return bad('Il faut votre nom et la modification proposée.')

  const { data: appeal } = await db.from('appeals').select('id, closed, version, hors_ligne, title').eq('slug', params.slug).single()
  if (!appeal) return bad('Introuvable.', 404)
  if (appeal.hors_ligne) return bad('Ce texte n’est plus en ligne.', 410)
  if (appeal.closed) return bad('Ce texte est clos, les suggestions sont fermées.', 409)

  const { error } = await db.from('suggestions').insert({
    appeal_id: appeal.id,
    version: appeal.version,
    author: b.author.trim(),
    // Proposition d'un autre titre : le passage visé est le titre en ligne.
    cible: b.cible === 'titre' ? 'titre' : null,
    quote: b.cible === 'titre' ? appeal.title : (b.quote?.trim() || null),
    proposal: b.proposal.trim(),
    reason: b.reason?.trim() || null,
  })
  if (error) return bad(error.message, 500)
  return json({ ok: true }, 201)
}
