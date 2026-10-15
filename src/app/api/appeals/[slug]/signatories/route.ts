import { db, token, json, bad, nameKey, signLogo } from '@/lib/db'

const OK_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const MAX_LOGO = 2 * 1024 * 1024 // 2 Mo

/** Retrouver sa propre réponse à partir du jeton de modification. */
export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const s = new URL(req.url).searchParams.get('s')
  if (!s) return bad('Jeton manquant.')

  const { data: appeal } = await db.from('appeals').select('id').eq('slug', params.slug).single()
  if (!appeal) return bad('Introuvable.', 404)

  const { data: row } = await db
    .from('signatories')
    .select('id, name, role, city, email, note, stance, version, logo_path, updated_at')
    .eq('appeal_id', appeal.id)
    .eq('edit_token', s)
    .maybeSingle()

  if (!row) return bad('Ce lien de signataire ne correspond à aucune réponse.', 404)
  const { logo_path, ...rest } = row
  return json({ signatory: { ...rest, logo_url: await signLogo(logo_path) } })
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const form = await req.formData().catch(() => null)
  if (!form) return bad('Formulaire illisible.')

  const name = String(form.get('name') ?? '').trim()
  const stance = String(form.get('stance') ?? 'oui')
  const editToken = String(form.get('s') ?? '').trim()
  const asNew = String(form.get('confirm') ?? '') === 'nouveau'

  if (!name) return bad('Il faut le nom de l’organisation ou de la personne.')
  if (!['oui', 'oui_si_modifs', 'non', 'reflexion'].includes(stance)) return bad('Réponse inconnue.')

  const { data: appeal } = await db.from('appeals').select('id, closed, version, hors_ligne').eq('slug', params.slug).single()
  if (!appeal) return bad('Introuvable.', 404)
  if (appeal.hors_ligne) return bad('Ce texte n’est plus en ligne.', 410)
  if (appeal.closed) return bad('Les signatures sont closes pour ce texte.', 409)

  // Le jeton est le seul titre à modifier une réponse existante.
  let existing: { id: string; logo_path: string | null } | null = null
  if (editToken) {
    const { data } = await db
      .from('signatories')
      .select('id, logo_path')
      .eq('appeal_id', appeal.id)
      .eq('edit_token', editToken)
      .maybeSingle()
    if (!data) return bad('Ce lien de signataire n’est plus valable.', 403)
    existing = data
  } else if (!asNew) {
    // Sans jeton, un nom déjà pris n'écrase rien : on demande confirmation.
    const { data: dup } = await db
      .from('signatories')
      .select('id')
      .eq('appeal_id', appeal.id)
      .eq('name_key', nameKey(name))
      .maybeSingle()
    if (dup)
      return Response.json(
        {
          error: `Une réponse existe déjà au nom de « ${name} ».`,
          code: 'name_taken',
        },
        { status: 409 },
      )
  }

  let logo_path: string | null = existing?.logo_path ?? null
  const file = form.get('logo')
  if (file instanceof File && file.size > 0) {
    if (!OK_TYPES.includes(file.type)) return bad('Logo accepté en PNG, JPEG, WebP ou SVG.')
    if (file.size > MAX_LOGO) return bad('Logo trop lourd : 2 Mo maximum. Choisissez une version plus légère de votre logo.')
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `${appeal.id}/${token(12)}.${ext}`
    const up = await db.storage.from('logos').upload(path, file, { contentType: file.type, upsert: false })
    if (up.error) return bad(`Le logo n’a pas pu être enregistré : ${up.error.message}`, 500)
    if (existing?.logo_path) await db.storage.from('logos').remove([existing.logo_path])
    logo_path = path
  }

  const row = {
    appeal_id: appeal.id,
    name_key: nameKey(name),
    name,
    role: String(form.get('role') ?? '').trim() || null,
    city: String(form.get('city') ?? '').trim() || null,
    email: String(form.get('email') ?? '').trim() || null,
    note: String(form.get('note') ?? '').trim() || null,
    stance,
    logo_path,
    version: appeal.version,
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    const { error } = await db.from('signatories').update(row).eq('id', existing.id)
    if (error) return bad(error.message, 500)
    return json({ ok: true, updated: true, s: editToken, version: appeal.version })
  }

  const s = token(20)
  const { error } = await db.from('signatories').insert({ ...row, edit_token: s })
  if (error) return bad(error.message, 500)
  return json({ ok: true, updated: false, s, version: appeal.version }, 201)
}
