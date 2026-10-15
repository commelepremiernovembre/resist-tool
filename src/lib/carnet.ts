// Carnets partagés entre les appareils d'une même personne : Paraphe (pétitions) et Mon espace.
// Chaque carnet est retrouvé par son code secret ; la base ne voit que son empreinte SHA-256,
// et n'est joignable que par deux fonctions (paraphe_lire / paraphe_ecrire).
import { createHash } from 'node:crypto'
import { db } from '@/lib/db'

type Item = { id: string; maj?: string; ajoute?: string; [k: string]: unknown }
type Supp = { id: string; maj: string }
type Carnet = { items: Item[]; supprimes: Supp[]; version: number }

export const CODE = /^[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/
const MAX_SUPPRIMES = 2000
// Le préfixe sépare les carnets : 'paraphe:' pour les pétitions, 'espace:' pour Mon espace.
export const empreinte = (prefixe: string, code: string) => createHash('sha256').update(prefixe + code).digest('hex')

export async function lire(e: string): Promise<Carnet> {
  const { data, error } = await db.rpc('paraphe_lire', { p_empreinte: e })
  if (error) throw new Error(error.message)
  return (data as Carnet) || { items: [], supprimes: [], version: 0 }
}

// Pour chaque pétition, la version modifiée le plus récemment l'emporte ;
// une suppression plus récente que la dernière modification l'efface.
export function fusionner(a: Partial<Carnet>, b: Partial<Carnet>) {
  const supp = new Map<string, string>()
  for (const s of [...(a.supprimes || []), ...(b.supprimes || [])])
    if (s?.id && (supp.get(s.id) || '') < (s.maj || '')) supp.set(s.id, s.maj || '')
  const parId = new Map<string, Item>()
  for (const i of [...(a.items || []), ...(b.items || [])]) {
    if (!i?.id) continue
    const ex = parId.get(i.id)
    if (!ex || (ex.maj || '') < (i.maj || '')) parId.set(i.id, i)
  }
  const items = [...parId.values()]
    .filter((i) => !(supp.has(i.id) && supp.get(i.id)! >= (i.maj || '')))
    .sort((x, y) => (y.ajoute || '').localeCompare(x.ajoute || ''))
  const supprimes = [...supp].map(([id, maj]) => ({ id, maj }))
    .sort((x, y) => y.maj.localeCompare(x.maj)).slice(0, MAX_SUPPRIMES)
  return { items, supprimes }
}

export const err = (error: string, status: number) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })

// Deux appareils peuvent écrire en même temps : on relit et on refusionne si la version a bougé.
export async function ecrire(e: string, b: { items?: unknown; supprimes?: unknown }) {
  const envoi = { items: Array.isArray(b.items) ? b.items : [], supprimes: Array.isArray(b.supprimes) ? b.supprimes : [] }
  try {
    for (let essai = 0; essai < 5; essai++) {
      const actuel = await lire(e)
      const f = fusionner(actuel, envoi)
      const { data: v, error } = await db.rpc('paraphe_ecrire', { p_empreinte: e, p_items: f.items, p_supprimes: f.supprimes, p_version: actuel.version })
      if (error) throw new Error(error.message)
      if (v != null) return Response.json({ ...f, version: v }, { headers: { 'Cache-Control': 'no-store' } })
    }
    return err('Carnet trop sollicité, réessayer.', 409)
  } catch (e) {
    return err(String((e as Error).message).slice(0, 200), 502)
  }
}

export async function lireReponse(e: string) {
  try { return Response.json(await lire(e), { headers: { 'Cache-Control': 'no-store' } }) }
  catch (x) { return err(String((x as Error).message).slice(0, 200), 502) }
}
