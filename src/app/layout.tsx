import type { Metadata, Viewport } from 'next'
import { Archivo, Instrument_Serif, Inter, Permanent_Marker, Rubik_Mono_One, Space_Mono, Special_Elite } from 'next/font/google'
import './globals.css'
import './punk.css'
import './classe.css'
import './nirvana.css'
import { InstallSW } from '@/components/InstallSW'

const display = Archivo({ subsets: ['latin'], weight: ['600', '800'], style: ['normal', 'italic'], variable: '--font-display' })
const body = Inter({ subsets: ['latin'], variable: '--font-body' })
// Version punk (en essai, activée seulement par un lien secret qui pose le cookie resist_theme=punk).
const punkDisplay = Rubik_Mono_One({ subsets: ['latin'], weight: '400', variable: '--font-punk' })
const punkMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-punk-mono' })
// Look « Classe » (cookie resist_theme=classe) : sobre, titres à empattements, angles droits.
const classeSerif = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--font-classe' })
// Look « Grunge » (cookie resist_theme=nirvana) : titres au feutre, boutons machine à écrire.
const nirvanaMarker = Permanent_Marker({ subsets: ['latin'], weight: '400', variable: '--font-nirvana' })
const nirvanaType = Special_Elite({ subsets: ['latin'], weight: '400', variable: '--font-nirvana-type' })

export const metadata: Metadata = {
  title: 'Resist ! — outils pour militer sans que ce soit relou',
  description: 'Signer des textes à plusieurs organisations, choisir une date de réunion, ranger ses pétitions.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon-192.png', apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'Resist !', statusBarStyle: 'default' },
}

export const viewport: Viewport = { themeColor: '#4B2AEF' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Un seul design depuis le 12/10/2026 : le normal. Les looks Punk, Classe, Grunge restent dans
  // punk.css / classe.css / nirvana.css mais ne s'appliquent plus (cookie resist_theme ignoré).
  const habillage = ''
  return (
    <html lang="fr" className={`${display.variable} ${body.variable} ${punkDisplay.variable} ${punkMono.variable} ${classeSerif.variable} ${nirvanaMarker.variable} ${nirvanaType.variable} ${habillage}`}>
      <body className="font-sans antialiased">{children}<InstallSW /><script src="/i18n.js" defer /></body>
    </html>
  )
}
