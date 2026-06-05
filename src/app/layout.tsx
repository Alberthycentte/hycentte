import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'HyCentte — AI Gig Intelligence',
  description: 'Analyze top gigs. Build yours to rank on page 1.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body>{children}</body>
    </html>
  )
}
