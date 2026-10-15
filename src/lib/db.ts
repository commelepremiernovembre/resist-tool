import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  // Message explicite au lieu d'un crash opaque au premier appel.
  console.warn('[resist] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquante — voir .env.local.example')
}

// Client serveur uniquement. La clé service_role ne doit jamais partir au navigateur.
export const db = createClient(url ?? 'http://localhost', key ?? 'missing', {
  auth: { persistSession: false },
})

const ALPHABET = 'abcdefghijkmnopqrstuvwxyz23456789'

export function token(len = 10) {
  const bytes = crypto.getRandomValues(new Uint8Array(len))
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

export function slugify(input: string) {
  const base = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  return `${base || 'texte'}-${token(4)}`
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status })
}

export function bad(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}

export function nameKey(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Le bucket "logos" est privé : rien n'est lisible sans une URL signée. */
export async function signLogo(path: string | null, seconds = 3600) {
  if (!path) return null
  const { data } = await db.storage.from('logos').createSignedUrl(path, seconds)
  return data?.signedUrl ?? null
}

export async function signLogos<T extends { logo_path?: string | null }>(rows: T[]) {
  return Promise.all(rows.map(async (r) => ({ ...r, logo_url: await signLogo(r.logo_path ?? null) })))
}
