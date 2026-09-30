import type { Metadata, Viewport } from 'next'
import { brand } from '@fmc/config/brand'
import './globals.css'

// O nome do produto vem de `brand` (ADR-0011) — nunca literal numa tela.
export const metadata: Metadata = {
  title: brand.name,
  description: brand.description,
  manifest: '/manifest.webmanifest',
  applicationName: brand.shortName,
  appleWebApp: { capable: true, title: brand.shortName, statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  themeColor: brand.themeColor,
  width: 'device-width',
  initialScale: 1,
  // O usuário está no sol, com luva: ele precisa poder ampliar.
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={brand.locale}>
      <body>{children}</body>
    </html>
  )
}
