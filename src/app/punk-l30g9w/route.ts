// Lien secret de la version punk : pose (ou retire avec ?off) le cookie resist_theme, puis revient à l'accueil.
// Pas d'HttpOnly : la page Paraphe (HTML autonome) le lit aussi pour s'habiller.
export function GET(req: Request) {
  const off = new URL(req.url).searchParams.has('off')
  const cookie = off
    ? `resist_theme=normal; Path=/; Max-Age=${60 * 60 * 24 * 365}; Secure; SameSite=Lax`
    : `resist_theme=punk; Path=/; Max-Age=${60 * 60 * 24 * 365}; Secure; SameSite=Lax`
  return new Response(null, { status: 303, headers: { Location: new URL('/', req.url).toString(), 'Set-Cookie': cookie, 'Cache-Control': 'no-store' } })
}
