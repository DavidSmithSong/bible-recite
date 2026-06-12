import Link from 'next/link'
import { HERO } from '@/lib/data/paintings'

export default function Home() {
  return (
    <Link href="/bible" className="block">
      <main className="relative min-h-screen overflow-hidden">
        {/* Hero painting */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={HERO.url}
            alt={HERO.title}
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/18 via-black/10 to-black/45" />
        </div>

        {/* Verse */}
        <div
          className="absolute left-1/2 top-[36vh] w-[min(86vw,34rem)] -translate-x-1/2 px-4 py-3 text-center md:top-[58vh] md:w-[min(70vw,34rem)] md:py-4"
          style={{ fontFamily: 'KaiTi, STKaiti, "Kaiti SC", serif' }}
        >
          <div className="absolute inset-0 -z-10 bg-black/25 [mask-image:linear-gradient(to_right,transparent,black_16%,black_84%,transparent)] md:bg-black/20" />
          <p
            className="text-sm leading-[1.9] text-[#eadfc8] md:text-lg md:leading-loose"
            style={{ textShadow: '0 2px 12px rgba(40, 24, 12, 0.68)' }}
          >
            圣经都是神所默示的，<br />
            于教训、督责、使人归正、教导人学义都是有益的，<br />
            叫属神的人得以完全，预备行各样的善事。
          </p>
          <p
            className="mt-4 text-sm text-[#d5c3a7]/80"
            style={{ textShadow: '0 2px 10px rgba(40, 24, 12, 0.72)' }}
          >
            提摩太后书 3:16–17
          </p>
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
