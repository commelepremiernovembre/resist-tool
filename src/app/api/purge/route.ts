import { db, json, bad } from '@/lib/db'
import { seuil } from '@/lib/duree'

// Appelée chaque nuit par le cron Vercel (vercel.json), qui envoie « Bearer CRON_SECRET ».
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return bad('Non.', 401)
  const avant = seuil()

  const { data: appeals, error } = await db.from('appeals').select('id').lt('created_at', avant).eq('hors_ligne', false) // hors ligne = archivé, gardé sans limite
  if (error) return bad(error.message, 500)
  const ids = (appeals ?? []).map((a) => a.id)

  // Les logos sont des fichiers : la cascade SQL ne les touche pas, on les retire d'abord.
  let logos = 0
  if (ids.length) {
    const { data: rows } = await db.from('signatories').select('logo_path').in('appeal_id', ids).not('logo_path', 'is', null)
    const { data: imgs } = await db.from('appeals').select('image_path').in('id', ids).not('image_path', 'is', null)
    const paths = [...(rows ?? []).map((r) => r.logo_path as string), ...(imgs ?? []).map((r) => r.image_path as string)]
    if (paths.length) {
      const { error: e } = await db.storage.from('logos').remove(paths)
      if (e) return bad(e.message, 500)
      logos = paths.length
    }
    const { error: e } = await db.from('appeals').delete().in('id', ids)
    if (e) return bad(e.message, 500)
  }

  const { data: polls, error: ep } = await db.from('polls').delete().lt('created_at', avant).select('id')
  if (ep) return bad(ep.message, 500)

  return json({ textes: ids.length, logos, sondages: polls?.length ?? 0 })
}
