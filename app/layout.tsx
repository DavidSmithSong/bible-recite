import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Discipleship Essentials',
  description: '圣经和合本 · 艾宾浩斯间隔复习',
}

export const viewport: Viewport = {
  colorScheme: 'dark light',
  themeColor: '#000000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] [font-family:SimSun,'Songti_SC','Noto_Serif_CJK_SC',serif]">
        {children}
      </body>
    </html>
  )
}
