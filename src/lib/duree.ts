// Durée de vie d'un lien : 180 jours après sa création, le texte ou le sondage
// (signataires, logos, votes compris) est effacé. /api/purge passe chaque nuit.
export const DUREE_JOURS = 180

export function finDeVie(created_at: string) {
  return new Date(new Date(created_at).getTime() + DUREE_JOURS * 86_400_000)
}

export const expire = (created_at: string) => finDeVie(created_at).getTime() <= Date.now()

export const effaceLe = (created_at: string) =>
  finDeVie(created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

/** Date limite de création au-delà de laquelle tout est à effacer. */
export const seuil = () => new Date(Date.now() - DUREE_JOURS * 86_400_000).toISOString()
