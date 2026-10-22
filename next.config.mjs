/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }] },
  // Paraphe est une page autonome (public/paraphe/index.html), servie à l'adresse /paraphe.
  async rewrites() {
    return [{ source: '/paraphe', destination: '/paraphe/index.html' }]
  },
  // Textes retirés du site (gardés en base) : la page publique renvoie à l'accueil, le pilotage reste ouvert. La visite est comptée (événement « Texte retiré visité »).
  async redirects() {
    return [].map((slug) => ({ source: `/signature/${slug}`, destination: `/?retire=${slug}`, permanent: false }))
  },
  async headers() {
    return [
      { source: '/paraphe', headers: [{ key: 'x-paraphe', value: '1' }, { key: 'Cache-Control', value: 'no-cache' }] },
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
    ]
  },
}
export default nextConfig;
