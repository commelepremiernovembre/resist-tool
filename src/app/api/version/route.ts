// Identifiant de la mise en ligne en cours : public/maj.js le compare à celui de la page ouverte
// pour recharger l'app installée sans avoir à la réinstaller.
export const dynamic = 'force-dynamic'

export function GET() {
  const v = process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_URL || 'local'
  return new Response(JSON.stringify({ v }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })
}
