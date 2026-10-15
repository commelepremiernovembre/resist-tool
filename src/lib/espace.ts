// « Mon espace » : ce que chacun a fait dans Resist (textes pilotés ou signés, sondages),
// retrouvé sur tous ses appareils sans compte. Le code secret est celui du carnet Paraphe
// (même clé du navigateur), donc relier un appareil relie tout d'un coup.
// Côté navigateur uniquement.

export type ElementEspace = {
  id: string // 'pilote:<slug>' | 'signe:<slug>' | 'reunion:<slug>'
  type: 'pilote' | 'signe' | 'reunion' | 'appareil' // 'appareil' : sert à savoir combien d'appareils sont reliés
  slug: string
  titre: string
  k?: string // clé de pilotage d'un texte
  s?: string // jeton de signataire d'un texte
  ajoute?: string
  maj?: string
  historique?: boolean // rangé dans l'historique de Mon espace (gardé, juste mis de côté)
}

export const K_CODE = 'paraphe.carnet'
const K_CACHE = 'resist.espace'
const K_SUPP = 'resist.espace.retires' // ids retirés, pour ne pas les remettre tout seuls
export const CODE = /^[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/

export function nouveauCode() {
  const a = 'abcdefghijkmnpqrstuvwxyz23456789'
  const c = [...crypto.getRandomValues(new Uint8Array(12))].map((x) => a[x % a.length]).join('')
  return c.slice(0, 4) + '-' + c.slice(4, 8) + '-' + c.slice(8)
}

export function monCode() {
  let c = ''
  try { c = localStorage.getItem(K_CODE) || '' } catch {}
  if (!CODE.test(c)) {
    c = nouveauCode()
    try { localStorage.setItem(K_CODE, c) } catch {}
  }
  return c
}

// Identifiant de cet appareil (navigateur), pour compter les appareils reliés.
export function monAppareil() {
  let a = ''
  try { a = localStorage.getItem('resist.appareil') || '' } catch {}
  if (!a) {
    a = nouveauCode()
    try { localStorage.setItem('resist.appareil', a) } catch {}
  }
  return a
}

export function lireCache(): ElementEspace[] {
  try { return JSON.parse(localStorage.getItem(K_CACHE) || '[]') } catch { return [] }
}
function ecrireCache(l: ElementEspace[]) {
  try { localStorage.setItem(K_CACHE, JSON.stringify(l)) } catch {}
}
export function retires(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(K_SUPP) || '[]')) } catch { return new Set() }
}

// Envoie au serveur (fusion par élément, le plus récent gagne) et garde la liste à jour ici.
export async function synchroniser(ajouts: ElementEspace[] = [], supprimes: { id: string; maj: string }[] = []) {
  const code = monCode()
  const res = await fetch('/api/espace', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code, items: ajouts, supprimes }),
  })
  if (!res.ok) throw new Error('Synchronisation impossible.')
  const b = await res.json()
  ecrireCache(b.items || [])
  try { localStorage.setItem(K_SUPP, JSON.stringify((b.supprimes || []).map((x: { id: string }) => x.id))) } catch {}
  return b.items as ElementEspace[]
}

// Note une action ; ne refait pas l'envoi si rien n'a changé.
// Un élément retiré de la liste n'y revient pas en rouvrant la page, seulement à une nouvelle création (nouveau = true).
export function noter(e: Omit<ElementEspace, 'id' | 'ajoute' | 'maj'>, nouveau = false) {
  const id = `${e.type}:${e.slug}`
  if (!nouveau && retires().has(id)) return
  const ex = lireCache().find((x) => x.id === id)
  if (ex && ex.titre === e.titre && ex.k === e.k && ex.s === e.s) return
  const maintenant = new Date().toISOString()
  const el: ElementEspace = { ...e, id, ajoute: ex?.ajoute || maintenant, maj: maintenant, ...(ex?.historique ? { historique: true } : {}) }
  ecrireCache([el, ...lireCache().filter((x) => x.id !== id)])
  synchroniser([el]).catch(() => {})
}
