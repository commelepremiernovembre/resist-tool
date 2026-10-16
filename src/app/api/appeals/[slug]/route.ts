import { db, json, bad, signLogos } from '@/lib/db'
import { expire } from '@/lib/duree'

type Ctx = { params: { slug: string } }

export async function GET(req: Request, { params }: Ctx) {
  const key = new URL(req.url).searchParams.get('k')

  const { data: appeal } = await db.from('appeals').select('*').eq('slug', params.slug).single()
  if (!appeal || (expire(appeal.created_at) && !appeal.hors_ligne)) return bad('Ce texte n’existe pas ou a été effacé (un lien dure 180 jours).', 404)

  const isAdmin = Boolean(key) && key === appeal.admin_key
  // Hors ligne : seul le pilotage y a encore accès.
  if (appeal.hors_ligne && !isAdmin) return bad('Ce texte n’est plus en ligne.', 410)

  const { data: rows } = await db
    .from('signatories')
    .select(
      'id, name, role, city, logo_path, stance, note, version, created_at, updated_at' +
        (isAdmin ? ', email, edit_token' : ''),
    )
    .eq('appeal_id', appeal.id)
    .order('created_at', { ascending: true })

  // Les logos vivent dans un bucket privé : on signe à l'affichage, une heure.
  const signatories = await signLogos((rows ?? []) as unknown as { logo_path: string | null }[])

  const sugQuery = db
    .from('suggestions')
    .select('id, author, quote, proposal, reason, status, version, created_at, cible')
    .eq('appeal_id', appeal.id)
    .order('created_at', { ascending: true })
  const { data: suggestions } = isAdmin ? await sugQuery : await sugQuery.neq('status', 'rejected')

  const { data: versions } = await db
    .from('appeal_versions')
    .select('id, number, body, note, created_at')
    .eq('appeal_id', appeal.id)
    .order('number', { ascending: false })

  // Le nombre de vues n'est montré qu'au pilotage.
  const { admin_key, vues, ...pub } = appeal
  return json({
    appeal: isAdmin ? { ...pub, vues } : pub,
    signatories,
    suggestions: suggestions ?? [],
    versions: versions ?? [],
    isAdmin,
  })
}

export async function PATCH(req: Request, { params }: Ctx) {
  const b = await req.json().catch(() => null)
  const { data: appeal } = await db.from('appeals').select('*').eq('slug', params.slug).single()
  if (!appeal) return bad('Introuvable.', 404)
  if (b?.k !== appeal.admin_key) return bad('Clé de pilotage invalide.', 403)

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  let newVersion: number | null = null

  // Publier une nouvelle version : on ne remplace jamais le texte en silence.
  if (typeof b.body === 'string' && b.body.trim() && b.body.trim() !== appeal.body) {
    newVersion = appeal.version + 1
    patch.body = b.body.trim()
    patch.version = newVersion
    const { error } = await db.from('appeal_versions').insert({
      appeal_id: appeal.id,
      number: newVersion,
      body: b.body.trim(),
      note: [b.fond === false ? 'Petite correction' : null, b.note?.trim()].filter(Boolean).join(' · ') || null,
    })
    if (error) return bad(error.message, 500)
    // Petite correction : ceux qui avaient signé la version en ligne passent à la nouvelle, sans revalider.
    // (Changement de fond : rien à faire, ils passent « à revalider ».)
    if (b.fond === false) {
      const { error: e2 } = await db.from('signatories').update({ version: newVersion })
        .eq('appeal_id', appeal.id).eq('version', appeal.version)
      if (e2) return bad(e2.message, 500)
    }
  }

  if (typeof b.closed === 'boolean') patch.closed = b.closed
  // Un texte archivé de plus de 180 jours serait effacé la nuit suivante s'il revenait en ligne.
  if (b.hors_ligne === false && appeal.hors_ligne && expire(appeal.created_at))
    return bad('Ce texte a plus de 180 jours : il reste en archive, il ne peut plus être remis en ligne.', 409)
  if (typeof b.hors_ligne === 'boolean') patch.hors_ligne = b.hors_ligne
  if (typeof b.deadline === 'string' || b.deadline === null) patch.deadline = b.deadline || null
  if (typeof b.title === 'string' && b.title.trim()) patch.title = b.title.trim()
  if (typeof b.porteur === 'string') patch.porteur = b.porteur.trim().slice(0, 120) || null

  const { error } = await db.from('appeals').update(patch).eq('id', appeal.id)
  if (error) return bad(error.message, 500)
  return json({ ok: true, version: newVersion ?? appeal.version })
}
