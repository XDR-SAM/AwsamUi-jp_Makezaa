import React from "react";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { SITE_ORIGIN, SITE_DESCRIPTION, previewImage } from "@/lib/seo";
import "./globals.css";
import "./studio.css";
import { StudioRouteTransitions } from "@/components/studio/route-transitions";

const lausanne = localFont({
  src: [
    {
      path: "../public/studio/framerusercontent.com/assets/b2K15NaOm6mFyCncGy3lk8jg.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/studio/framerusercontent.com/assets/tMTRMPmybaHx0IPae0t8iCda4.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/studio/framerusercontent.com/assets/LWqutRi2ylYfA1k62YXyS5DPA.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-lausanne",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "Makezaa | Web Development & Digital Solutions",
    template: "%s | Makezaa",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Makezaa",
    title: "Makezaa | Web Development & Digital Solutions",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: previewImage("site", "home"),
        width: 1200,
        height: 630,
        alt: "Makezaa — Web development & digital solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [previewImage("site", "home")],
  },
  generator: "Makezaa",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${lausanne.variable} font-sans antialiased`}>
        <noscript><style>{`.studio-loader { display: none !important; }`}</style></noscript>
        <StudioRouteTransitions>{children}</StudioRouteTransitions>
        <Analytics />
      </body>
    </html>
  );
}
