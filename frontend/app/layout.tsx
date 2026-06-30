import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'Community Hero — Report. Track. Resolve.',
  description: 'AI-powered civic issue reporting and resolution for Indian cities.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
