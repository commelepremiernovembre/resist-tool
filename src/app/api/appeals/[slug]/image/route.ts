// Image d'un texte, choisie au pilotage (15/10/2026). Sans image : l'icône R! bleue de Textes.
// Adresse stable (pour Paraphe et les aperçus de lien) ; on redirige vers une URL signée du bucket privé « logos ».
import { db, token, json, bad, signLogo } from '@/lib/db'

export const dynamic = 'force-dynamic'

const OK_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX = 2 * 1024 * 1024 // 2 Mo, comme les logos

type Ctx = { params: { slug: string } }

export async function GET(req: Request, { params }: Ctx) {
  const { data } = await db.from('appeals').select('image_path').eq('slug', params.slug).maybeSingle()
  const url = (await signLogo(data?.image_path ?? null)) || new URL('/icon-textes.png', req.url).toString()
  return new Response(null, { status: 302, headers: { Location: url, 'Cache-Control': 'public, max-age=300' } })
}

async function pilote(slug: string, k: unknown) {
  const { data: appeal } = await db.from('appeals').select('id, admin_key, image_path').eq('slug', slug).single()
  if (!appeal) return { erreur: bad('Introuvable.', 404) }
  if (k !== appeal.admin_key) return { erreur: bad('Clé de pilotage invalide.', 403) }
  return { appeal }
}

export async function POST(req: Request, { params }: Ctx) {
  const form = await req.formData().catch(() => null)
  if (!form) return bad('Envoi illisible.')
  const { appeal, erreur } = await pilote(params.slug, form.get('k'))
  if (erreur) return erreur
  const file = form.get('image')
  if (!(file instanceof File) || !file.size) return bad('Aucune image reçue.')
  if (!OK_TYPES.includes(file.type)) return bad('Image acceptée en PNG, JPEG ou WebP.')
  if (file.size > MAX) return bad('Image trop lourde : 2 Mo maximum.')
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${appeal!.id}/image-${token(10)}.${ext}`
  const up = await db.storage.from('logos').upload(path, file, { contentType: file.type, upsert: false })
  if (up.error) return bad(`L’image n’a pas pu être enregistrée : ${up.error.message}`, 500)
  const { error } = await db.from('appeals').update({ image_path: path }).eq('id', appeal!.id)
  if (error) return bad(error.message, 500)
  if (appeal!.image_path) await db.storage.from('logos').remove([appeal!.image_path])
  return json({ ok: true })
}

// Revenir à l'icône R! bleue.
export async function DELETE(req: Request, { params }: Ctx) {
  const b = await req.json().catch(() => null)
  const { appeal, erreur } = await pilote(params.slug, b?.k)
  if (erreur) return erreur
  if (appeal!.image_path) await db.storage.from('logos').remove([appeal!.image_path])
  const { error } = await db.from('appeals').update({ image_path: null }).eq('id', appeal!.id)
  if (error) return bad(error.message, 500)
  return json({ ok: true })
}
