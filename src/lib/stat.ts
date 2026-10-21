// Événements Vercel Web Analytics (21/10/2026) : on compte les actions, jamais leur contenu ni les noms.
// Même file d'attente que @vercel/analytics : le script /_vercel/insights/script.js la vide en arrivant.
export function stat(name: string, data?: Record<string, string | number>) {
  try {
    const w = window as any
    w.va = w.va || function (...params: unknown[]) { (w.vaq = w.vaq || []).push(params) }
    w.va('event', { name, data })
  } catch {}
}
