import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '4th of July Invitational - Harbor Way Soccer Tennis',
  description: '16th Annual 4th of July Invitational Soccer Tennis Tournament at Harbor Way',
  keywords: ['soccer tennis', 'tournament', '4th of July', 'Harbor Way'],
  authors: [{ name: 'Tournament System' }],
  creator: 'Tournament System',
  publisher: 'Harbor Way Soccer Tennis',
  formatDetection: {
    telephone: false,
  },
  // PWA and mobile optimizations
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '4th of July Tournament',
    startupImage: [
      {
        url: '/placeholder-logo.png',
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  // Open Graph
  openGraph: {
    title: '4th of July Invitational - Harbor Way Soccer Tennis',
    description: '16th Annual 4th of July Invitational Soccer Tennis Tournament',
    url: 'https://your-domain.com',
    siteName: '4th of July Tournament',
    images: [
      {
        url: '/placeholder-logo.png',
        width: 1200,
        height: 630,
        alt: '4th of July Tournament Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: '4th of July Invitational - Harbor Way Soccer Tennis',
    description: '16th Annual 4th of July Invitational Soccer Tennis Tournament',
    images: ['/placeholder-logo.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Mobile-first viewport settings */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        
        {/* PWA and mobile app settings */}
        <meta name="theme-color" content="#dc2626" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="4th of July Tournament" />
        
        {/* Prevent zoom on form focus (iOS) */}
        <meta name="format-detection" content="telephone=no" />
        
        {/* Preload key resources */}
        <link rel="preload" href="/placeholder-logo.png" as="image" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/placeholder-logo.png" />
        
        {/* Manifest for PWA */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      </head>
      <body className={`${inter.className} h-full antialiased`}>
        {/* Mobile-first app shell */}
        <div className="min-h-full bg-slate-900">
          <main className="pb-20 safe-area-inset-bottom">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
