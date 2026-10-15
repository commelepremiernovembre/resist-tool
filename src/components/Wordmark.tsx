import Link from 'next/link'

export function Wordmark({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const big = size === 'lg'
  return (
    <Link href="/" className="inline-block group">
      <span
        className={`font-display font-extrabold italic tracking-tight text-violet ${
          big ? 'text-5xl sm:text-6xl' : 'text-2xl'
        }`}
      >
        Resist&nbsp;!
      </span>
      <span
        className={`stroke-in block rounded-full bg-violet ${big ? 'mt-1 h-[5px] w-[70%]' : 'mt-0.5 h-[3px] w-[70%]'}`}
      />
    </Link>
  )
}
