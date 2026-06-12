import Link from 'next/link'
import { HERO } from '@/lib/data/paintings'

export default function Home() {
  return (
    <Link href="/bible" className="block">
      <main className="relative min-h-screen flex items-center justify-center">
        {/* Hero painting */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={HERO.url}
            alt={HERO.title}
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        {/* Verse */}
        <div className="relative px-10 max-w-2xl w-full">
          <p className="text-white text-lg leading-loose tracking-wide font-light text-left">
            圣经都是神所默示的，于教训、督责、使人归正、教导人学义都是有益的，<br />
            叫属神的人得以完全，预备行各样的善事。
          </p>
          <p className="text-white/50 text-sm mt-4 tracking-widest text-center">提摩太后书 3:16–17</p>
        </div>

        {/* Painting credit */}
        <div className="absolute bottom-5 right-6 text-right">
          <p className="text-white/25 text-xs">{HERO.title}</p>
          <p className="text-white/25 text-xs">{HERO.artistZh} · {HERO.year}</p>
        </div>
      </main>
    </Link>
  )
}
