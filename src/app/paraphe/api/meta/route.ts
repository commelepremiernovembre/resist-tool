// Paraphe : lit le vrai titre d'une page de pétition (impossible depuis le navigateur : CORS).
import { db } from '@/lib/db'

const DECODE: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: ' ' }

function nettoyer(s: string) {
  return s
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (_, e) => DECODE[e])
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ')
    .trim()
}

function extraire(html: string, prop: string) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']|` +
      `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`,
    'i',
  )
  const m = html.match(re)
  return m ? nettoyer(m[1] || m[2]) : null
}

// Titres de partage passe-partout (Change.org met « Signez la pétition » partout) : on prend alors
// le titre de la page ou son h1.
// Règle pour tous les sites : un titre passe-partout (ou qui n'est que le nom du site) ne compte pas.
const GENERIQUE = /^((signez|signer|sign)( la| the| this)? p[ée]tition|signez|sign now|kampanyay[ıi] imzala|p[ée]titions?|accueil|home|page d'accueil)\s*!?$/i
const generique = (t: string, site: string) =>
  GENERIQUE.test(t) || (!!site && t.toLowerCase().replace(/\W/g, '') === site.toLowerCase().replace(/\W/g, ''))
// Titre de page épuré, pour tous les sites : « Pétition · X - France · Change.org » → « X »,
// « X | Mesopinions » → « X », « X - Greenpeace France » → « X » (seulement si la fin est le nom du site).
function epurer(t: string, site: string) {
  t = t.replace(/^p[ée]tition\s*[·:|–-]\s*/i, '')
  const parts = t.split(/\s+[·|–—]\s+|\s+-\s+/)
  const nom = site.toLowerCase().replace(/\W/g, '')
  while (parts.length > 1) {
    const fin = parts[parts.length - 1].toLowerCase().replace(/\W/g, '')
    if (nom && (fin.includes(nom) || nom.includes(fin)) || /^(france|fr)$/.test(fin)) parts.pop()
    else break
  }
  return parts.join(' - ').trim()
}

const vide = () => Response.json({ titre: null, site: null })

// Un lien de Resist (texte à signer, sondage) : la page est derrière le mot de passe et ne donne
// que « Resist ! » ; on lit le vrai titre dans la base.
async function titreResist(u: URL) {
  if (!/(^|\.)resist-tool\.vercel\.app$/.test(u.hostname)) return null
  const m = u.pathname.match(/^\/(signature|reunion)\/([^/]+)/)
  if (!m) return null
  const { data } = (m[1] === 'signature'
    ? await db.from('appeals').select('title, porteur').eq('slug', m[2]).maybeSingle()
    : await db.from('polls').select('title').eq('slug', m[2]).maybeSingle()) as { data: { title?: string; porteur?: string | null } | null }
  const porteur = data?.porteur
  return data?.title ? { titre: String(data.title).slice(0, 160), site: porteur || 'Resist !', url: u.toString(), image: u.origin + (m[1] === 'reunion' ? '/icon-reunion.png' : `/api/appeals/${m[2]}/image`) } : null
}

export async function GET(req: Request) {
  const cible = new URL(req.url).searchParams.get('url')
  if (!cible || !/^https?:\/\//i.test(cible)) return Response.json({ erreur: 'Adresse manquante ou invalide' }, { status: 400 })

  try {
    const interne = await titreResist(new URL(cible))
    if (interne) return Response.json(interne, { headers: { 'Cache-Control': 'no-store' } })
    const r = await fetch(cible, {
      signal: AbortSignal.timeout(7000),
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Paraphe/1.0; +lecture de titre)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      },
      cache: 'no-store',
    })
    if (!r.ok) return vide()
    // Le <head> suffit.
    const html = (await r.text()).slice(0, 120000)
    const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
    const site = extraire(html, 'og:site_name')
    const nomSite = site || new URL(r.url).hostname.replace(/^www\./, '').split('.')[0]
    const candidats = [extraire(html, 'og:title'), extraire(html, 'twitter:title'), t ? nettoyer(t[1]) : null, h1 ? nettoyer(h1[1].replace(/<[^>]+>/g, ' ')) : null]
      .map((c) => (c ? epurer(c, nomSite) : null))
    const titre = candidats.find((c) => c && !generique(c, nomSite)) || candidats.find(Boolean) || null
    // Résumé donné par le site lui-même (pour savoir ce qu'on va signer), s'il dit autre chose que le titre.
    const desc = extraire(html, 'og:description') || extraire(html, 'description') || extraire(html, 'twitter:description')
    const resume = desc && titre && desc.toLowerCase() !== titre.toLowerCase() ? desc.slice(0, 220) : null
    // Vignette : l'image de partage de la page, sinon l'icône du site, sinon son favicon.
    const absolu = (h: string | null) => { try { return h ? new URL(h, r.url).toString() : null } catch { return null } }
    const icone = html.match(/<link[^>]+rel=["'][^"']*(?:apple-touch-icon|icon)[^"']*["'][^>]*>/i)?.[0].match(/href=["']([^"']+)["']/i)?.[1] || null
    const image = absolu(extraire(html, 'og:image') || extraire(html, 'twitter:image') || icone || '/favicon.ico')
    return Response.json(
      { titre: titre ? titre.slice(0, 160) : null, site: site ? site.slice(0, 60) : null, url: r.url, image: image && /^https:/.test(image) ? image : null, resume },
      { headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate' } },
    )
  } catch {
    return vide()
  }
}
