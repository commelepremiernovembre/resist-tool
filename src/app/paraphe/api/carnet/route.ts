// Paraphe : carnet de pétitions partagé entre les appareils d'une même personne (voir src/lib/carnet.ts).
import { CODE, empreinte, ecrire, err, lireReponse } from '@/lib/carnet'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const code = (new URL(req.url).searchParams.get('code') || '').toLowerCase()
  if (!CODE.test(code)) return err('Code de carnet invalide.', 400)
  return lireReponse(empreinte('paraphe:', code))
}

export async function POST(req: Request) {
  const b = await req.json().catch(() => null)
  const code = String(b?.code || '').toLowerCase()
  if (!CODE.test(code)) return err('Code de carnet invalide.', 400)
  return ecrire(empreinte('paraphe:', code), b)
}
