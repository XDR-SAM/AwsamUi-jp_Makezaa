import React from "react"
import type { Metadata } from 'next'
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SITE_ORIGIN, SITE_DESCRIPTION, previewImage } from '@/lib/seo'
import './globals.css'

const instrumentSans = Instrument_Sans({ 
  subsets: ["latin"],
  variable: '--font-instrument'
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: '--font-instrument-serif'
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: '--font-jetbrains'
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: { default: 'Makezaa | Web Development & Digital Solutions', template: '%s | Makezaa' },
  description: SITE_DESCRIPTION,
  openGraph: { type: 'website', siteName: 'Makezaa', title: 'Makezaa | Web Development & Digital Solutions',
    description: SITE_DESCRIPTION, images: [{ url: previewImage('site', 'home'), width: 1200, height: 630, alt: 'Makezaa — Web development & digital solutions' }] },
  twitter: { card: 'summary_large_image', images: [previewImage('site', 'home')] },
  generator: 'Makezaa',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${instrumentSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
