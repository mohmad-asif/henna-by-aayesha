import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { getCanonicalUrl } from '@/config/site';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { fetchSiteSettings } from '@/lib/supabase/data';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4E2714',
};

export const metadata: Metadata = {
  metadataBase: new URL(getCanonicalUrl()),
  title: {
    default: 'Henna by Aayesha | Mehndi Artist in Bangalore',
    template: '%s | Henna by Aayesha',
  },
  description:
    'Exquisite bespoke bridal, Arabic, and traditional mehndi designs in Bangalore / Bengaluru. 100% natural organic henna, personalized consultations, and appointments strictly via WhatsApp.',
  keywords: [
    'Henna by Aayesha',
    'Mehndi Artist Bangalore',
    'Mehndi Artist in Bangalore',
    'Mehndi Artist Bengaluru',
    'Mehndi Artist in Bengaluru',
    'Bridal Mehndi Bangalore',
    'Bridal Henna Bangalore',
    'Arabic Mehndi Bangalore',
    'Henna Artist Bangalore',
    'Organic Henna Bangalore',
    'Wedding Mehndi Artist Bangalore',
  ],
  authors: [{ name: 'Aayesha' }],
  creator: 'Henna by Aayesha',
  publisher: 'Henna by Aayesha',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/fav.png', type: 'image/png' },
    ],
    shortcut: '/fav.png',
    apple: [
      { url: '/fav.png', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: getCanonicalUrl(),
    title: 'Henna by Aayesha | Mehndi Artist in Bangalore',
    description:
      'Exquisite bespoke bridal, Arabic, and traditional mehndi designs in Bangalore. 100% natural organic henna. Appointments exclusively via WhatsApp.',
    siteName: 'Henna by Aayesha',
    images: [
      {
        url: '/images/hero-bride.jpg',
        width: 1200,
        height: 900,
        alt: 'Henna by Aayesha - Professional Mehndi Artist in Bangalore',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Henna by Aayesha | Mehndi Artist in Bangalore',
    description:
      'Exquisite bespoke bridal, Arabic, and traditional mehndi designs in Bangalore. 100% natural organic henna.',
    images: ['/images/hero-bride.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteSettings = await fetchSiteSettings();

  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${plusJakarta.variable} h-full antialiased`}
    >
      <body className="font-sans-body min-h-screen flex flex-col bg-[#FCF9F4] text-[#261B16]">
        {/* Skip to Main Content Link for Keyboard Accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[#4E2714] focus:text-[#FAF3EE] focus:rounded-lg focus:shadow-xl focus:ring-2 focus:ring-[#C29B4D] focus:outline-none text-sm font-semibold"
        >
          Skip to main content
        </a>
        <Header settings={siteSettings} />
        <main id="main-content" className="flex-grow focus:outline-none" tabIndex={-1}>
          {children}
        </main>
        <Footer settings={siteSettings} />
      </body>
    </html>
  );
}
