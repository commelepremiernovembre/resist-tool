export type Stance = 'oui' | 'oui_si_modifs' | 'non' | 'reflexion'

export const STANCE_LABEL: Record<Stance, string> = {
  oui: 'Oui',
  oui_si_modifs: 'Oui, si les modifs suggérées sont intégrées',
  non: 'Non',
  reflexion: 'En cours de réflexion',
}

export const STANCE_SHORT: Record<Stance, string> = {
  oui: 'Signé',
  oui_si_modifs: 'Signé sous réserve',
  non: 'Ne signe pas',
  reflexion: 'En réflexion',
}

export type Answer = 'oui' | 'si_besoin' | 'non'

export const ANSWER_LABEL: Record<Answer, string> = {
  oui: 'Dispo',
  si_besoin: 'Si besoin',
  non: 'Pas dispo',
}

export type Appeal = {
  id: string
  slug: string
  title: string
  body: string
  intro: string | null
  deadline: string | null
  contact: string | null
  version: number
  closed: boolean
  hors_ligne?: boolean // retiré du lien public, gardé au pilotage
  vues?: number // visible seulement au pilotage
  image_path?: string | null // image choisie au pilotage (sinon icône R! bleue)
  porteur?: string | null // organisation(s) qui portent le texte (sinon « Resist ! » dans Paraphe)
  created_at: string
  updated_at: string
}

export type Version = {
  id: string
  number: number
  body: string
  note: string | null
  created_at: string
}

export type Suggestion = {
  id: string
  author: string
  quote: string | null
  proposal: string
  reason: string | null
  status: 'open' | 'accepted' | 'rejected'
  version: number
  created_at: string
}

export type Signatory = {
  id: string
  name: string
  role: string | null
  city: string | null
  stance: Stance
  note: string | null
  version: number
  created_at: string
  updated_at: string
  logo_url?: string | null
  email?: string | null
  edit_token?: string | null
}

export type Poll = {
  id: string
  slug: string
  title: string
  place: string | null
  note: string | null
}

export type Slot = { id: string; starts_at: string; minutes: number }
export type Vote = { id: string; name: string; answers: Record<string, Answer>; created_at: string }
