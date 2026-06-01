import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from 'next/script';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'BEMS - Batch Entry Management',
  description: 'Batch Entry Management System (BEMS)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head></head>
      <body className="bg-[#f8fafc] text-slate-800 antialiased min-h-screen flex flex-col font-sans" suppressHydrationWarning>
        {children}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        <SpeedInsights />
      </body>
    </html>
  );
}
