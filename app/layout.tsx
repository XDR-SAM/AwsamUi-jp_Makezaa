import React from "react"
import type { Metadata } from 'next'
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
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
  title: 'Makezaa | Web Development & Digital Solutions',
  description: 'Makezaa builds fast websites, apps, and digital strategy for businesses. React, Next.js, Node.js — clean code, on time.',
  generator: 'Makezaa',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "Makezaa",
  "image": "https://makezaa.com/favicon.png",
  "@id": "https://makezaa.com",
  "url": "https://makezaa.com",
  "telephone": ["+880****0990", "+880****7033"],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "351-3, Dhanmondi",
    "addressLocality": "Dhaka",
    "postalCode": "1209",
    "addressCountry": "BD"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 23.7461,
    "longitude": 90.3742
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": [
      "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
    ],
    "opens": "00:00",
    "closes": "23:59"
  },
  "sameAs": [
    "https://www.facebook.com/makezaa.inc",
    "https://www.linkedin.com/company/makezaa"
  ],
  "founder": [
    {
      "@type": "Person",
      "name": "Abdullah Al Sami",
      "jobTitle": "Founder & CEO"
    },
    {
      "@type": "Person",
      "name": "Arghya Biswas",
      "jobTitle": "Co-Founder & CTO"
    }
  ],
  "employee": [
    {
      "@type": "Person",
      "name": "Abdullah Al Sami",
      "jobTitle": "CEO"
    },
    {
      "@type": "Person",
      "name": "Arghya Biswas",
      "jobTitle": "CTO"
    }
  ],
  "description": "Makezaa provides next-level web experience including Web Development, Brand Identity and SEO services."
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${instrumentSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
