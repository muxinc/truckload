import type { Metadata } from 'next';

import '@/_styles/globals.css';

export const metadata: Metadata = {
  title: 'Truckload - move your videos with ease',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className="p-4 font-sans">{children}</body>
    </html>
  );
}
