// src/app/layout.tsx - TEMPORARY FIX WITH CDN
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ETH Faucet - Free Test Ethereum',
  description: 'Get free test ETH for development on Ethereum testnets',
  keywords: ['ethereum', 'faucet', 'test', 'development', 'web3'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          {`tailwind.config = {
            theme: {
              extend: {
                colors: {
                  clifford: '#da373d',
                }
              }
            }
          }`}
        </script>
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}