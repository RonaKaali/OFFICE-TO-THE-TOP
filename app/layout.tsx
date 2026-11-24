import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OFFICE TO THE TOP | AI Multi-Agent & UMKM Hub',
  description: 'Local-First Multi-Agent WhatsApp System & UMKM Deployment Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
