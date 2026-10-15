import { db, json } from '@/lib/db'

// Compte une ouverture de la page publique d'un texte (affiché au pilotage seulement).
export async function POST(_req: Request, { params }: { params: { slug: string } }) {
  await db.rpc('resist_vue', { p_slug: params.slug })
  return json({ ok: true })
}
