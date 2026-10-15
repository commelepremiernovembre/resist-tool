/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }] },
  // Paraphe est une page autonome (public/paraphe/index.html), servie à l'adresse /paraphe.
  async rewrites() {
    return [{ source: '/paraphe', destination: '/paraphe/index.html' }]
  },
  async headers() {
    return [
      { source: '/paraphe', headers: [{ key: 'x-paraphe', value: '1' }, { key: 'Cache-Control', value: 'no-cache' }] },
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
    ]
  },
}
export default nextConfig;
