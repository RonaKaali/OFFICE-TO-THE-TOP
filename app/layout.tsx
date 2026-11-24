import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'OFFICE TO THE TOP | AI Virtual Office 3D',
  description: 'Full-Screen Interactive 3D Office Diorama for Autonomous AI Agents',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="h-full w-full overflow-hidden">
      <body className="h-full w-full overflow-hidden bg-slate-950 text-slate-100 antialiased select-none">
        {children}
      </body>
    </html>
  )
}
