import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '背经练习',
  description: '圣经和合本 · 艾宾浩斯间隔复习',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="bg-stone-50 text-stone-900 min-h-screen">
        {children}
      </body>
    </html>
  )
}
