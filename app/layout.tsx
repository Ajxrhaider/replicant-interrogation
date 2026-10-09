import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Replicant Interrogation | Hizakilabs',
  description: 'A six-turn empathy test for identifying rogue androids.',
  icons: { icon: [{ url: '/icon.ico' }, { url: '/icon.svg', type: 'image/svg+xml' }], shortcut: '/favicon.ico', apple: '/favicon.svg' },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
