import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Replicant Interrogation | Hizakilabs',
  description: 'A six-turn empathy test for identifying rogue androids.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}