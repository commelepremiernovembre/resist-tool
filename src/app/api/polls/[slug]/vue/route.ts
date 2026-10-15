import { db, json } from '@/lib/db'

// Compte une ouverture du sondage (hors appareil qui l'a créé).
export async function POST(_req: Request, { params }: { params: { slug: string } }) {
  await db.rpc('resist_vue_sondage', { p_slug: params.slug })
  return json({ ok: true })
}
