import type { Metadata, Viewport } from 'next'
import { ReactNode } from 'react'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Saira_Condensed, Archivo } from 'next/font/google'

import HeaderNavPanel from './components/ui/HeaderNavPanel'
import FooterPanel from './components/ui/FooterPanel'
import './globals.css'

const saira = Saira_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-oswald',
})
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-roboto-condensed',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.clubcricketofchicago.com'),
  title: {
    default: 'Club Cricket of Chicago | Competitive Cricket',
    template: '%s | Club Cricket of Chicago',
  },
  description: 'Competitive cricket, fixtures, results, player statistics, and club news from Club Cricket of Chicago.',
  icons: { icon: '/images/favicon.ico' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${saira.variable} ${archivo.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "(function(){try{var t=localStorage.getItem('ccc-theme');document.documentElement.dataset.theme=(t==='light'?'light':'dark');}catch(e){document.documentElement.dataset.theme='dark';}})();",
          }}
        />
        <link rel="preconnect" href="https://media.cricclubs.com" crossOrigin="" />
      </head>
      <body>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-R3N32PZ8ND" strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-R3N32PZ8ND');`}
        </Script>
        <div className="site_shell">
          <HeaderNavPanel />
          <main id="main-content" tabIndex={-1}>{children}</main>
          <FooterPanel />
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
