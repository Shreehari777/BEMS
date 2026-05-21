import type { Metadata } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-serif',
});

export const metadata: Metadata = {
  title: 'BEMS - Batch Entry Management',
  description: 'Batch Entry Management System (BEMS)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <head>
        <script src="https://checkout.razorpay.com/v1/checkout.js" defer></script>
      </head>
      <body className="bg-[#f8fafc] text-slate-800 antialiased min-h-screen flex flex-col font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
