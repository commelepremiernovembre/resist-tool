import { db, bad, signLogo } from '@/lib/db'
import { STANCE_LABEL, type Stance } from '@/lib/types'

const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const key = new URL(req.url).searchParams.get('k')
  const { data: appeal } = await db.from('appeals').select('id, slug, admin_key, version').eq('slug', params.slug).single()
  if (!appeal) return bad('Introuvable.', 404)
  if (key !== appeal.admin_key) return bad('Clé de pilotage invalide.', 403)

  const { data: rows } = await db
    .from('signatories')
    .select('*')
    .eq('appeal_id', appeal.id)
    .order('created_at', { ascending: true })

  const head = ['Nom', 'Fonction', 'Ville', 'Réponse', 'Version signée', 'À revalider', 'Commentaire', 'Email', 'Logo (lien 7 jours)', 'Dernière réponse']
  const lines = await Promise.all(
    (rows ?? []).map(async (r) =>
      [
        r.name,
        r.role,
        r.city,
        STANCE_LABEL[r.stance as Stance] ?? r.stance,
        `v${r.version}`,
        r.version < appeal.version && (r.stance === 'oui' || r.stance === 'oui_si_modifs') ? 'oui' : '',
        r.note,
        r.email,
        await signLogo(r.logo_path, 60 * 60 * 24 * 7),
        new Date(r.updated_at ?? r.created_at).toLocaleString('fr-FR'),
      ]
        .map(cell)
        .join(','),
    ),
  )

  const csv = [head.map(cell).join(','), ...lines].join('\r\n')

  return new Response('\uFEFF' + csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="signataires-${appeal.slug}-v${appeal.version}.csv"`,
    },
  })
}
