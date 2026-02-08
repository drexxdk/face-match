import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Suspense } from 'react';
import { Toaster } from '@/components/ui/toast';
import { SWRProvider } from '@/components/providers/swr-provider';
import { ServiceWorkerRegistration } from '@/components/pwa/service-worker-registration';
import { InstallPrompt } from '@/components/pwa/install-prompt';
import { AuthStateListener } from '@/components/auth/auth-state-listener';
import { OnlineStatus } from '@/components/online-status';

const defaultUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Guess Who - Social Learning Game',
  description: 'An icebreaker game that helps people learn names and faces in groups, teams, and classrooms',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Guess Who',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Guess Who - Social Learning Game',
    description: 'An icebreaker game that helps people learn names and faces in groups, teams, and classrooms',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

const geistSans = Geist({
  variable: '--font-geist-sans',
  display: 'swap',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <a
          href="#main-content"
          className="focus:bg-primary sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:p-4 focus:text-white"
        >
          Skip to main content
        </a>
        <ServiceWorkerRegistration />
        <AuthStateListener />
        <OnlineStatus />
        <Toaster />
        <SWRProvider>
          <Suspense>
            <main id="main-content">{children}</main>
          </Suspense>
        </SWRProvider>
        <InstallPrompt />
      </body>
    </html>
  );
}
