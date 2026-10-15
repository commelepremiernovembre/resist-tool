// Ancien lien du look chili/fanzine (retiré) : mène maintenant au look Classe.
// Pas d'HttpOnly : la page Paraphe (HTML autonome) le lit aussi pour s'habiller.
export function GET(req: Request) {
  const off = new URL(req.url).searchParams.has('off')
  const cookie = off
    ? `resist_theme=normal; Path=/; Max-Age=${60 * 60 * 24 * 365}; Secure; SameSite=Lax`
    : `resist_theme=classe; Path=/; Max-Age=${60 * 60 * 24 * 365}; Secure; SameSite=Lax`
  return new Response(null, { status: 303, headers: { Location: new URL('/', req.url).toString(), 'Set-Cookie': cookie, 'Cache-Control': 'no-store' } })
}
